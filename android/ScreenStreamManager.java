package com.iFilter.Services.socket;

import android.content.Context;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaFormat;
import android.media.projection.MediaProjection;
import android.os.Build;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

/**
 * Captures the device screen via MediaProjection + MediaCodec and streams
 * H.264 frames over a WebSocket to the /screen relay on the Node.js server.
 *
 * Capture chain:
 *   MediaProjection → VirtualDisplay → MediaCodec input Surface
 *   MediaCodec output buffers → WebSocket binary frames
 *
 * Wire format (unchanged from the previous screenrecord implementation):
 *   [0]     0x00 = SPS/PPS codec-config packet (sent once before the first frame)
 *           0x01 = H.264 video frame
 *   [1..4]  payload size (uint32, big-endian)
 *   [5..]   raw H.264 bytes (Annex-B, as emitted by MediaCodec)
 *
 * Usage:
 *   ScreenStreamManager mgr = new ScreenStreamManager(context, wsUrl);
 *   mgr.start(mediaProjection);   // MediaProjection obtained via ScreenCaptureRequestActivity
 *   ...
 *   mgr.stop();
 */
public class ScreenStreamManager {

    private static final String TAG = "ScreenStreamManager";

    static final byte FRAME_TYPE_CONFIG = 0x00;
    static final byte FRAME_TYPE_VIDEO  = 0x01;

    // ---------------------------------------------------------------------------
    // Adaptive bitrate tiers (bps).
    // The controller steps down when the WebSocket queue backs up and steps up
    // when it drains.  Keeping tiers far apart avoids rapid oscillation.
    // ---------------------------------------------------------------------------
    private static final int[] BITRATE_TIERS = {
            80_000,     // tier 0 — emergency
            200_000,    // tier 1 — very poor
            400_000,    // tier 2 — poor
            800_000,    // tier 3 — fair
            1_500_000,  // tier 4 — good
            3_000_000,  // tier 5 — excellent (starting tier)
    };
    private static final int STARTING_TIER = 5;

    // Queue thresholds in bytes.
    // If queueSize > DROP_THRESHOLD → drop non-keyframes (latency protection).
    // If queueSize > STEP_DOWN_THRESHOLD for STEP_DOWN_FRAMES consecutive frames
    //   → lower bitrate tier.
    // If queueSize < STEP_UP_THRESHOLD for STEP_UP_FRAMES consecutive frames
    //   → raise bitrate tier.
    private static final long DROP_THRESHOLD       = 128 * 1024;  // 128 KB
    private static final long STEP_DOWN_THRESHOLD  =  64 * 1024;  //  64 KB
    private static final long STEP_UP_THRESHOLD    =  16 * 1024;  //  16 KB
    private static final int  STEP_DOWN_FRAMES     =   5;  // ~0.17 s at 30 fps — react fast to congestion
    private static final int  STEP_UP_FRAMES       =  60;  //  ~2 s at 30 fps — recover quality quickly

    private static final int   I_FRAME_INTERVAL     = 3;           // seconds (shorter = faster loss recovery)
    private static final long  REPEAT_FRAME_DELAY_US = 100_000L;   // 100 ms in µs
    private static final int   DEQUEUE_TIMEOUT_US   = 10_000;      // 10 ms

    private final Context context;
    private final String  wsUrl;

    private MediaProjection mediaProjection;
    private VirtualDisplay  virtualDisplay;
    private MediaCodec      mediaCodec;
    private Surface         inputSurface;

    private WebSocket    webSocket;
    private OkHttpClient httpClient;
    private Thread       encoderThread;

    private final AtomicBoolean running = new AtomicBoolean(false);

    // Adaptive bitrate state (only accessed from the encoder thread)
    private int currentTier       = STARTING_TIER;
    private int congestionFrames  = 0;   // consecutive frames with high queue
    private int clearFrames       = 0;   // consecutive frames with low queue

    public ScreenStreamManager(Context context, String wsUrl) {
        this.context = context.getApplicationContext();
        this.wsUrl   = wsUrl;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public void start(MediaProjection projection) {
        if (running.getAndSet(true)) {
            Log.w(TAG, "Already running — ignoring start()");
            return;
        }
        this.mediaProjection = projection;
        currentTier      = STARTING_TIER;
        congestionFrames = 0;
        clearFrames      = 0;
        Log.i(TAG, "Starting screen stream → " + wsUrl);
        connectWebSocket();
    }

    public void stop() {
        if (!running.getAndSet(false)) return;
        Log.i(TAG, "Stopping screen stream");

        Thread t = encoderThread;
        encoderThread = null;
        if (t != null) t.interrupt();

        if (mediaCodec != null) {
            try { mediaCodec.signalEndOfInputStream(); } catch (Exception ignored) {}
        }

        if (t != null) {
            try { t.join(1500); } catch (InterruptedException ignored) {}
        }

        releaseCapture();

        if (webSocket != null) {
            webSocket.close(1000, "Screen session ended");
            webSocket = null;
        }
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient = null;
        }
    }

    public boolean isRunning() { return running.get(); }

    // -------------------------------------------------------------------------
    // WebSocket connection
    // -------------------------------------------------------------------------

    private void connectWebSocket() {
        httpClient = new OkHttpClient.Builder()
                .pingInterval(20, TimeUnit.SECONDS)
                .connectTimeout(10, TimeUnit.SECONDS)
                .build();

        httpClient.newWebSocket(new Request.Builder().url(wsUrl).build(), new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                webSocket = ws;
                Log.i(TAG, "Screen WebSocket connected");
                try {
                    startCapture();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start capture", e);
                    stop();
                }
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                Log.e(TAG, "Screen WebSocket failure: " + t.getMessage());
                running.set(false);
                releaseCapture();
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                Log.i(TAG, "Screen WebSocket closed (" + code + "): " + reason);
                if (running.get()) stop();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Capture setup
    // -------------------------------------------------------------------------

    private void startCapture() throws IOException {
        DisplayMetrics metrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        Display display = wm.getDefaultDisplay();
        display.getRealMetrics(metrics);

        int encodeW = (metrics.widthPixels  / 2) & ~1;
        int encodeH = (metrics.heightPixels / 2) & ~1;
        int density = metrics.densityDpi;

        Log.i(TAG, String.format("Encode: %dx%d @ %d bps (tier %d)",
                encodeW, encodeH, BITRATE_TIERS[currentTier], currentTier));

        mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC);

        MediaFormat format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, encodeW, encodeH);
        format.setInteger(MediaFormat.KEY_BIT_RATE,     BITRATE_TIERS[currentTier]);
        format.setInteger(MediaFormat.KEY_FRAME_RATE,   30);
        format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);
        format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL);
        format.setLong(MediaFormat.KEY_REPEAT_PREVIOUS_FRAME_AFTER, REPEAT_FRAME_DELAY_US);
        // Main profile: better compression than Baseline (~15-20% quality gain at same bitrate)
        format.setInteger(MediaFormat.KEY_PROFILE, MediaCodecInfo.CodecProfileLevel.AVCProfileMain);
        format.setInteger(MediaFormat.KEY_LEVEL,   MediaCodecInfo.CodecProfileLevel.AVCLevel4);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            format.setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_LIMITED);
        }

        mediaCodec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
        inputSurface = mediaCodec.createInputSurface();

        mediaProjection.registerCallback(new MediaProjection.Callback() {
            @Override
            public void onStop() {
                Log.i(TAG, "MediaProjection stopped externally");
                stop();
            }
        }, new android.os.Handler(android.os.Looper.getMainLooper()));

        virtualDisplay = mediaProjection.createVirtualDisplay(
                "iFilter-Screen",
                encodeW, encodeH, density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                inputSurface,
                null,
                null);

        mediaCodec.start();

        encoderThread = new Thread(this::encoderLoop, "ScreenEncoder");
        encoderThread.setDaemon(true);
        encoderThread.start();
    }

    // -------------------------------------------------------------------------
    // Encoder drain loop
    // -------------------------------------------------------------------------

    private void encoderLoop() {
        MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
        Log.d(TAG, "Encoder loop started");

        try {
            while (running.get() && !Thread.currentThread().isInterrupted()) {
                int outputBufferId = mediaCodec.dequeueOutputBuffer(bufferInfo, DEQUEUE_TIMEOUT_US);

                if (outputBufferId == MediaCodec.INFO_TRY_AGAIN_LATER) continue;
                if (outputBufferId == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    Log.d(TAG, "Output format: " + mediaCodec.getOutputFormat());
                    continue;
                }
                if (outputBufferId < 0) continue;

                try {
                    boolean isEos    = (bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                    boolean isConfig = (bufferInfo.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG)   != 0;
                    boolean isKey    = (bufferInfo.flags & MediaCodec.BUFFER_FLAG_KEY_FRAME)       != 0;

                    if (bufferInfo.size > 0) {
                        adaptBitrate(isConfig || isKey);

                        WebSocket ws = webSocket;
                        long queueSize = ws != null ? ws.queueSize() : 0;

                        // Drop non-keyframes when the send queue is heavily backed up.
                        // This sacrifices FPS to prevent latency from growing unbounded.
                        boolean shouldDrop = !isConfig && !isKey && queueSize > DROP_THRESHOLD;

                        if (!shouldDrop) {
                            ByteBuffer encodedData = mediaCodec.getOutputBuffer(outputBufferId);
                            sendFrame(encodedData, bufferInfo.offset, bufferInfo.size, isConfig);

                            // After a heavy-drop period clears, force IDR so the dashboard decoder resyncs
                            if (isKey && queueSize < DROP_THRESHOLD / 4 && congestionFrames == 0) {
                                Bundle sync = new Bundle();
                                sync.putInt(MediaCodec.PARAMETER_KEY_REQUEST_SYNC_FRAME, 0);
                                mediaCodec.setParameters(sync);
                            }
                        } else {
                            Log.v(TAG, "Dropping frame — queue backed up: " + queueSize + " B");
                        }
                    }

                    if (isEos) {
                        Log.d(TAG, "EOS received — exiting encoder loop");
                        break;
                    }
                } finally {
                    mediaCodec.releaseOutputBuffer(outputBufferId, false);
                }
            }
        } catch (Exception e) {
            if (running.get()) Log.e(TAG, "Encoder loop error", e);
        }

        Log.d(TAG, "Encoder thread exiting");
        if (running.get()) stop();
    }

    // -------------------------------------------------------------------------
    // Adaptive bitrate
    // Uses WebSocket queueSize() as a real-time congestion signal.
    // Called once per output frame from the encoder thread.
    // -------------------------------------------------------------------------

    private void adaptBitrate(boolean isKeyFrame) {
        WebSocket ws = webSocket;
        if (ws == null || mediaCodec == null) return;

        long queueSize = ws.queueSize();

        if (queueSize > STEP_DOWN_THRESHOLD) {
            clearFrames = 0;
            congestionFrames++;
            if (congestionFrames >= STEP_DOWN_FRAMES && currentTier > 0) {
                currentTier--;
                congestionFrames = 0;
                applyBitrateChange();
            }
        } else if (queueSize < STEP_UP_THRESHOLD) {
            congestionFrames = 0;
            clearFrames++;
            if (clearFrames >= STEP_UP_FRAMES && currentTier < BITRATE_TIERS.length - 1) {
                currentTier++;
                clearFrames = 0;
                applyBitrateChange();
            }
        } else {
            // Queue is in the middle — reset both counters to avoid oscillation
            congestionFrames = 0;
            clearFrames      = 0;
        }
    }

    private void applyBitrateChange() {
        int newBitrate = BITRATE_TIERS[currentTier];
        Log.i(TAG, "Adaptive bitrate → tier " + currentTier + " (" + newBitrate + " bps)");

        Bundle params = new Bundle();
        params.putInt(MediaCodec.PARAMETER_KEY_VIDEO_BITRATE, newBitrate);
        mediaCodec.setParameters(params);

        // Force an IDR frame so the decoder and browser can resync immediately
        Bundle syncParams = new Bundle();
        syncParams.putInt(MediaCodec.PARAMETER_KEY_REQUEST_SYNC_FRAME, 0);
        mediaCodec.setParameters(syncParams);
    }

    // -------------------------------------------------------------------------
    // Frame transmission
    // Wire format: [1 byte type][4 bytes big-endian size][payload]
    // -------------------------------------------------------------------------

    private void sendFrame(ByteBuffer data, int offset, int size, boolean isConfig) {
        WebSocket ws = webSocket;
        if (ws == null || !running.get()) return;

        byte[] packet = new byte[5 + size];
        packet[0] = isConfig ? FRAME_TYPE_CONFIG : FRAME_TYPE_VIDEO;
        packet[1] = (byte) ((size >>> 24) & 0xFF);
        packet[2] = (byte) ((size >>> 16) & 0xFF);
        packet[3] = (byte) ((size >>>  8) & 0xFF);
        packet[4] = (byte) ( size         & 0xFF);

        ByteBuffer slice = data.duplicate();
        slice.position(offset);
        slice.limit(offset + size);
        slice.get(packet, 5, size);

        ws.send(ByteString.of(packet));
        Log.v(TAG, String.format("Sent %s frame: %d bytes",
                isConfig ? "CONFIG" : "VIDEO", size));
    }

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    private void releaseCapture() {
        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }
        if (mediaCodec != null) {
            try { mediaCodec.stop(); } catch (Exception ignored) {}
            mediaCodec.release();
            mediaCodec = null;
        }
        if (inputSurface != null) {
            inputSurface.release();
            inputSurface = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
    }
}
