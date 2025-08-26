-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: אוגוסט 24, 2025 בזמן 10:58 AM
-- גרסת שרת: 10.11.10-MariaDB
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u435853548_iFilter`
--

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `apps_categories`
--

CREATE TABLE `apps_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_icon` varchar(255) DEFAULT NULL,
  `category_description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `apps_categories`
--

INSERT INTO `apps_categories` (`category_id`, `category_name`, `category_icon`, `category_description`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'בנקים', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/banks_icon.svg', NULL, 1, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(2, 'יהדות', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/judaism_icon.svg', NULL, 2, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(3, 'פיננסי', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/financial_icon.svg', NULL, 3, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(5, 'כלים ועזרים', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/tools_icon.svg', NULL, 5, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(6, 'חינוכי', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/education_icon.svg', NULL, 6, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(7, 'בריאות', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/health_icon.svg', NULL, 7, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(8, 'מוזיקה', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/music_icon.svg', NULL, 8, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(9, 'צילום', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/photography_icon.svg', NULL, 9, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45'),
(10, 'ניווט ונסיעות', 'https://ikosher.me/iFilter/AppsCenter/uploads/categories_icons/navigation_icon.svg', NULL, 10, 1, '2025-05-07 13:30:02', '2025-08-24 09:44:45');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `app_configs`
--

CREATE TABLE `app_configs` (
  `id` int(11) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  `config_type` enum('views','activities') NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `client_level_id` int(11) NOT NULL DEFAULT 1,
  `config_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config_content`)),
  `config_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `app_configs`
--

INSERT INTO `app_configs` (`id`, `package_name`, `config_type`, `version`, `client_level_id`, `config_content`, `config_url`, `created_at`, `updated_at`) VALUES
(1, 'com.example.myapp', 'views', 2, 1, '{\"blocked_views\":[{\"view_id\":\"com.example.myapp.MainActivity\",\"view_class\":\"android.widget.Button\",\"view_text\":\"Premium Feature\",\"block_reason\":\"Requires premium subscription\"},{\"view_id\":\"com.example.myapp.SettingsActivity\",\"view_class\":\"android.widget.ImageView\",\"resource_name\":\"premium_badge\",\"block_reason\":\"Premium content\"}],\"allowed_views\":[{\"view_id\":\"com.example.myapp.MainActivity\",\"view_class\":\"android.widget.TextView\",\"view_text\":\"Welcome\"}],\"view_modifications\":[{\"view_id\":\"com.example.myapp.HomeActivity\",\"action\":\"hide\",\"target_class\":\"android.widget.LinearLayout\",\"conditions\":{\"user_level\":\"basic\"}}],\"filters\":{\"enabled\":true,\"strict_mode\":false,\"whitelist_mode\":true},\"metadata\":{\"version\":\"1.0\",\"description\":\"View filtering configuration for MyApp\",\"last_updated\":\"2024-01-15T10:30:00Z\"}}', 'https://ikosher.me/iFilter/AppsConfigs/com.example.myapp/views.json', '2025-07-27 09:40:25', '2025-07-29 09:17:42'),
(2, 'com.example.myapp', 'activities', 3, 1, '[\"BetaTestActivity\",\"NewActivity\",\"waze.MapActivity\"]', 'https://ikosher.me/iFilter/AppsConfigs/com.example.myapp/activities.json', '2025-07-27 09:41:29', '2025-07-27 11:25:45'),
(5, 'com.example.app', 'activities', 1, 1, '[\"com.example.app.activities.SomeActivity\"]', 'https://ikosher.me/iFilter/AppsConfigs/com.example.app/activities.json', '2025-07-29 09:13:01', '2025-07-29 09:13:01'),
(6, 'com.whatsapp', 'activities', 4, 1, '[\"com.example.app.activities.SomeActivity\",\"com.example.app.activities.SomeActivity\",\"com.whatsapp.Conversation\",\"com.whatsapp.Conversation\"]', 'https://ikosher.me/iFilter/AppsConfigs/com.whatsapp/activities.json', '2025-07-29 09:13:12', '2025-08-19 04:18:08'),
(9, 'com.instagram', 'views', 1, 1, '{\"blocked_views\":[{\"view_id\":\"com.example.myapp.MainActivity\",\"view_class\":\"android.widget.Button\",\"view_text\":\"Premium Feature\",\"block_reason\":\"Requires premium subscription\"},{\"view_id\":\"com.example.myapp.SettingsActivity\",\"view_class\":\"android.widget.ImageView\",\"resource_name\":\"premium_badge\",\"block_reason\":\"Premium content\"}],\"allowed_views\":[{\"view_id\":\"com.example.myapp.MainActivity\",\"view_class\":\"android.widget.TextView\",\"view_text\":\"Welcome\"}],\"view_modifications\":[{\"view_id\":\"com.example.myapp.HomeActivity\",\"action\":\"hide\",\"target_class\":\"android.widget.LinearLayout\",\"conditions\":{\"user_level\":\"basic\"}}],\"filters\":{\"enabled\":true,\"strict_mode\":false,\"whitelist_mode\":true},\"metadata\":{\"version\":\"1.0\",\"description\":\"View filtering configuration for MyApp\",\"last_updated\":\"2024-01-15T10:30:00Z\"}}', 'https://ikosher.me/iFilter/AppsConfigs/com.instagram/views.json', '2025-07-29 09:17:56', '2025-07-29 09:17:56'),
(10, 'com.unicell.pangoandroid', 'views', 2, 1, '[{\"id\":\"com.unicell.pangoandroid:id\\/splash_logo\",\"class\":\"androidx.appcompat.widget.AppCompatImageView\",\"parentId\":\"no-id\",\"position\":0,\"activityName\":\"BootActivity\",\"viewPath\":\"RelativeLayout[0]\",\"width\":420,\"height\":114}]', 'https://ikosher.me/iFilter/AppsConfigs/com.unicell.pangoandroid/views.json', '2025-08-07 14:49:13', '2025-08-07 14:52:30'),
(12, 'com.safecashapps', 'views', 1, 1, '[{\"id\":\"error\",\"class\":\"com.facebook.react.views.image.ReactImageView\",\"parentId\":\"error\",\"position\":0,\"activityName\":\"MainActivity\",\"viewPath\":\"ReactViewGroup[0]\",\"width\":223,\"height\":223}]', 'https://ikosher.me/iFilter/AppsConfigs/com.safecashapps/views.json', '2025-08-07 14:55:15', '2025-08-07 14:55:15'),
(13, 'com.androidlab.gpsfix', 'views', 3, 1, '[{\"id\":\"com.androidlab.gpsfix:id\\/mapview\",\"class\":\"com.androidlab.gpsfix.view.map.StaticMapView\",\"parentId\":\"no-id\",\"position\":0,\"activityName\":\"MainActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":708,\"height\":425},{\"id\":\"com.androidlab.gpsfix:id\\/mapview\",\"class\":\"com.androidlab.gpsfix.view.map.StaticMapView\",\"parentId\":\"no-id\",\"position\":0,\"activityName\":\"MainActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":708,\"height\":425},{\"id\":\"com.androidlab.gpsfix:id\\/mapview\",\"class\":\"com.androidlab.gpsfix.view.map.StaticMapView\",\"parentId\":\"no-id\",\"position\":0,\"activityName\":\"MainActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":708,\"height\":425},{\"id\":\"com.androidlab.gpsfix:id\\/img3\",\"class\":\"android.support.v7.widget.AppCompatImageView\",\"parentId\":\"no-id\",\"position\":2,\"activityName\":\"MainActivity\",\"viewPath\":\"LinearLayout[2]\",\"width\":58,\"height\":96},{\"id\":\"com.androidlab.gpsfix:id\\/buttonMap\",\"class\":\"android.support.v7.widget.AppCompatImageButton\",\"parentId\":\"no-id\",\"position\":1,\"activityName\":\"MainActivity\",\"viewPath\":\"RelativeLayout[1]\",\"width\":112,\"height\":104}]', 'https://ikosher.me/iFilter/AppsConfigs/com.androidlab.gpsfix/views.json', '2025-08-17 08:09:48', '2025-08-17 08:10:58'),
(16, 'com.whatsapp', 'views', 2, 1, '[{\"id\":\"com.whatsapp:id\\/newsletter_directory_photo\",\"class\":\"com.whatsapp.wds.components.profilephoto.WDSProfilePhoto\",\"parentId\":\"com.whatsapp:id\\/newsletter_directory_photo_container\",\"position\":0,\"activityName\":\"HomeActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":104,\"height\":104,\"contentDesc\":\"למסירה ❤\"},{\"id\":\"com.whatsapp:id\\/newsletter_directory_photo\",\"class\":\"com.whatsapp.wds.components.profilephoto.WDSProfilePhoto\",\"parentId\":\"com.whatsapp:id\\/newsletter_directory_photo_container\",\"position\":0,\"activityName\":\"HomeActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":104,\"height\":104,\"contentDesc\":\"עמוד לעריכות🫶🏼\"},{\"id\":\"com.whatsapp:id\\/newsletter_directory_photo\",\"class\":\"com.whatsapp.wds.components.profilephoto.WDSProfilePhoto\",\"parentId\":\"com.whatsapp:id\\/newsletter_directory_photo_container\",\"position\":0,\"activityName\":\"HomeActivity\",\"viewPath\":\"FrameLayout[0]\",\"width\":104,\"height\":104,\"contentDesc\":\"למסירה ❤\"},{\"id\":\"com.whatsapp:id\\/empty_community_row_hero_image\",\"class\":\"com.whatsapp.WaImageView\",\"parentId\":\"com.whatsapp:id\\/empty_community_row_container\",\"position\":0,\"activityName\":\"HomeActivity\",\"viewPath\":\"LinearLayout[0]\",\"width\":456,\"height\":424}]', 'https://ikosher.me/iFilter/AppsConfigs/com.whatsapp/views.json', '2025-08-18 17:42:58', '2025-08-19 04:21:47'),
(19, 'com.stratumauth.app', 'activities', 1, 1, '[\"com.stratumauth.app.MainActivity\"]', 'https://ikosher.me/iFilter/AppsConfigs/com.stratumauth.app/activities.json', '2025-08-19 04:20:08', '2025-08-19 04:20:08');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `app_store_apps`
--

CREATE TABLE `app_store_apps` (
  `app_id` int(11) NOT NULL,
  `app_name` varchar(255) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  `version_name` varchar(50) DEFAULT NULL,
  `version_code` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `download_url` varchar(255) DEFAULT NULL,
  `size` decimal(10,2) DEFAULT NULL,
  `update_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `score` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `app_store_apps`
--

INSERT INTO `app_store_apps` (`app_id`, `app_name`, `package_name`, `version_name`, `version_code`, `description`, `category_id`, `icon_url`, `download_url`, `size`, `update_date`, `created_at`, `updated_at`, `score`) VALUES
(91, 'Calculator', 'com.google.android.calculator', '8.7 (735708245)', 85006267, '‏מחשבון פשוט יותר בשביל Android', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.calculator_icon_1755796207.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.calculator_85006267_1755796207.apks', 1.98, '2025-08-21', '2025-08-21 17:10:07', '2025-08-21 17:10:07', 2.2),
(92, 'Clock', 'com.google.android.deskclock', '7.14 (771143455)', 76007610, '‏שעון מעורר פשוט ויפה בשביל Android', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.deskclock_icon_1755796209.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.deskclock_76007610_1755796209.apks', 5.80, '2025-08-21', '2025-08-21 17:10:09', '2025-08-21 17:10:09', 2.5),
(93, 'AccuWeather', 'com.accuweather.android', '21.1.1-6-rc', 210101006, 'AccuWeather - קבל מזג מקומי, 15 ימי תחזית, מפות רדאר ועוד הרבה יותר!', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.accuweather.android_icon_1755796212.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.accuweather.android_210101006_1755796212.apks', 10.88, '2025-08-21', '2025-08-21 17:10:12', '2025-08-21 17:10:12', 4.3),
(94, 'Files by Google', 'com.google.android.apps.nbu.files', '1.8122.782547211.0-release', 1437511, 'נקה את הטלפון שלך, מצא קבצים, הפעל מדיה ושתף קבצים במצב לא מקוון', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.nbu.files_icon_1755796214.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.apps.nbu.files_1437511_1755796214.apks', 9.80, '2025-08-21', '2025-08-21 17:10:14', '2025-08-21 17:10:14', 2.3),
(95, 'Contacts', 'com.google.android.contacts', '4.61.28.792249534', 3237353, 'גיבוי אנשי הקשר וגישה אליהם מכל מקום', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.contacts_icon_1755796216.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.contacts_3237353_1755796216.apks', 9.56, '2025-08-21', '2025-08-21 17:10:16', '2025-08-21 17:10:16', 2.5),
(96, 'Keep Notes', 'com.google.android.keep', '5.25.322.00.90', 220623296, 'Google Keep', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.keep_icon_1755796218.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.keep_220623296_1755796218.apks', 10.77, '2025-08-21', '2025-08-21 17:10:18', '2025-08-21 17:10:18', 3.6),
(97, 'LastPass', 'com.lastpass.lpandroid', '6.34.1.16925', 540016925, 'הסיסמה האחרונה שתצטרך אי פעם.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.lastpass.lpandroid_icon_1755796218.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.lastpass.lpandroid_540016925_1755796218.apks', 17.22, '2025-08-21', '2025-08-21 17:10:18', '2025-08-21 17:10:18', 1.1),
(98, 'Calendar', 'com.google.android.calendar', '2025.32.0-793391913-release', 2017857002, '‏הודות ליומן Google, חלק מ-Google Workspace, נשארים בעניינים ומספיקים יותר', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.calendar_icon_1755796219.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.calendar_2017857002_1755796219.apks', 13.86, '2025-08-21', '2025-08-21 17:10:19', '2025-08-21 17:10:19', 2),
(99, 'Drive', 'com.google.android.apps.docs', '2.25.320.7.all.alldpi', 214123596, 'אחסון חינם באינטרנט מ-Google.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.docs_icon_1755796220.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.apps.docs_214123596_1755796220.apks', 24.13, '2025-08-21', '2025-08-21 17:10:20', '2025-08-21 17:10:20', 2.1),
(100, 'Fit', 'com.google.android.apps.fitness', '2025.07.03.00.arm64-v8a.release', 2027068517, '‏רוצה לקחת אחריות על הבריאות שלך? Google Fit יכול לעזור לך להשיג את היעדים שלך.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.fitness_icon_1755796222.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.apps.fitness_2027068517_1755796222.apks', 12.50, '2025-08-21', '2025-08-21 17:10:22', '2025-08-21 17:10:22', 2.3),
(101, 'Dropbox', 'com.dropbox.android', '438.2.2', 43820200, 'Share files &amp; memories safely. Keep your photos and videos secure.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.dropbox.android_icon_1755796230.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.dropbox.android_43820200_1755796229.apks', 55.52, '2025-08-21', '2025-08-21 17:10:30', '2025-08-21 17:10:30', 2.7),
(102, 'Photos', 'com.google.android.apps.photos', '7.38.0.785903005', 50465458, 'הבית לכל הזיכרונות: להיזכר ברגעים, לשתף אותם ולסדר את התמונות.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.photos_icon_1755796242.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.apps.photos_50465458_1755796242.apks', 53.20, '2025-08-21', '2025-08-21 17:10:42', '2025-08-21 17:10:42', 4.2),
(103, 'Gmail', 'com.google.android.gm', '2025.08.04.793813908.Release', 65273116, '‏אימייל מ-Google', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.gm_icon_1755796242.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.google.android.gm_65273116_1755796242.apks', 48.64, '2025-08-21', '2025-08-21 17:10:42', '2025-08-21 17:10:42', 2.1),
(104, 'Wolt', 'com.wolt.android', '25.33.0', 132025330, 'מסעדות, מצרכים וחנויות במשלוח מהיר', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.wolt.android_icon_1755796244.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.wolt.android_132025330_1755796244.apks', 65.33, '2025-08-21', '2025-08-21 17:10:44', '2025-08-21 17:10:44', 2.9),
(105, 'Airbnb', 'com.airbnb.android', '25.33', 28014281, 'למצוא את מקום האירוח המושלם לחופשה, לחיות כמו המקומיים, לגלות חוויות חדשות.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.airbnb.android_icon_1755796245.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.airbnb.android_28014281_1755796245.apks', 42.38, '2025-08-21', '2025-08-21 17:10:45', '2025-08-21 17:10:45', 2.4),
(106, 'Coinbase', 'com.coinbase.android', '13.30.8', 133000080, 'Put crypto to work &amp; earn rewards. Stake crypto like Ethereum, Solana &amp; Cardano', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.coinbase.android_icon_1755796248.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.coinbase.android_133000080_1755796247.apks', 97.85, '2025-08-21', '2025-08-21 17:10:48', '2025-08-21 17:10:48', 2.3),
(107, 'Waze', 'com.waze', '5.10.0.2', 1030634, 'מקבלים עדכונים בזמן אמת על עומסי תנועה, משטרה, תאונות, מחירי דלק ועוד', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.waze_icon_1755796248.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.waze_1030634_1755796248.apks', 72.77, '2025-08-21', '2025-08-21 17:10:48', '2025-08-21 17:10:48', 2.3),
(108, 'Teams', 'com.microsoft.teams', '1416/1.0.0.2025143402', 2025143425, 'צ\'אט, היפגש ושתף פעולה כדי להשיג יותר ביחד, הכל במקום אחד ב-Teams', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.microsoft.teams_icon_1755796249.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.microsoft.teams_2025143425_1755796248.apks', 73.14, '2025-08-21', '2025-08-21 17:10:49', '2025-08-21 17:10:49', 2.1),
(109, 'Adobe Acrobat', 'com.adobe.reader', '25.8.0.40839', 1930840839, 'Easy doc access, more organization. Save, sort, and share your important PDFs.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.adobe.reader_icon_1755796256.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.adobe.reader_1930840839_1755796256.apks', 61.92, '2025-08-21', '2025-08-21 17:10:56', '2025-08-21 17:10:56', 2.8),
(110, 'OneNote', 'com.microsoft.office.onenote', '16.0.18925.20004', 1806647611, 'פנקס רשימות חזק שמאפשר לך לרשום רעיונות ולשמור הערות. ארגן ושתף הערות בקלות', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.microsoft.office.onenote_icon_1755796257.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.microsoft.office.onenote_1806647611_1755796257.apks', 78.16, '2025-08-21', '2025-08-21 17:10:57', '2025-08-21 17:10:57', 1.8),
(111, 'Uber', 'com.ubercab', '4.592.10000', 239715, 'Rideshare, taxi cabs, and more for your airport travels and everyday trips.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.ubercab_icon_1755796258.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.ubercab_239715_1755796258.apks', 102.80, '2025-08-21', '2025-08-21 17:10:58', '2025-08-21 17:10:58', 1.5),
(112, 'Booking.com', 'com.booking', '58.7.1', 31257, 'Book your whole trip in one app.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.booking_icon_1755796260.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.booking_31257_1755796260.apks', 70.91, '2025-08-21', '2025-08-21 17:11:00', '2025-08-21 17:11:00', 1.8),
(113, 'Evernote', 'com.evernote', '10.151.2', 1242500, 'פנקס רשימות ומתכנן: רשום הערות, צור משימות יומיות וארגן רשימות מטלות.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.evernote_icon_1755796263.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.evernote_1242500_1755796263.apks', 81.90, '2025-08-21', '2025-08-21 17:11:03', '2025-08-21 17:11:03', 1.8),
(114, 'Revolut', 'com.revolut.revolut', '10.92', 1009204931, 'Change the way you money', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.revolut.revolut_icon_1755796264.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.revolut.revolut_1009204931_1755796263.apks', 123.75, '2025-08-21', '2025-08-21 17:11:04', '2025-08-21 17:11:04', 2.3),
(115, 'Binance', 'com.binance.dev', '3.1.6', 100300106, 'גש לבורסת מטבעות קריפטוגרפיים* ולארנק web3 הגדולים ביותר בכל זמן ובכל מקום.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.binance.dev_icon_1755796265.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.binance.dev_100300106_1755796264.apks', 123.75, '2025-08-21', '2025-08-21 17:11:05', '2025-08-21 17:11:05', 2.6),
(116, 'בנק הפועלים', 'com.ideomobile.hapoalim', '43.3.3', 678, 'אפליקציה מתקדמת לניהול החשבון בסלולר, המציעה חוויה בנקאית ייחודית לפעילות הלקוח.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.ideomobile.hapoalim_icon_1755796266.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.ideomobile.hapoalim_678_1755796265.apks', 84.16, '2025-08-21', '2025-08-21 17:11:06', '2025-08-21 17:11:06', 4.9),
(117, 'לאומי', 'com.leumi.leumiwallet', '143.0.13', 23876, 'אפליקציית לאומי', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.leumi.leumiwallet_icon_1755796278.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.leumi.leumiwallet_23876_1755796277.apks', 166.74, '2025-08-21', '2025-08-21 17:11:18', '2025-08-21 17:11:18', 1.9),
(119, 'Moovit', 'com.tranzmate', '5.175.1.1741', 1741, 'הכל על תחבורה ציבורית - תכנון מסלול, זמני אמת, לוחות זמנים, התראות, תשלום בנייד', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.tranzmate_icon_1755796340.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.tranzmate_1755796340.apks', 34.95, '2025-08-21', '2025-08-21 17:12:20', '2025-08-21 17:12:20', 2.2),
(125, 'WhatsApp', 'com.whatsapp', '2.25.22.80', 252280000, 'פשוט. אישי. מאובטח.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.whatsapp_icon_1755796373.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.whatsapp_1755796373.apks', 62.33, '2025-08-21', '2025-08-21 17:12:53', '2025-08-21 17:12:53', 2.9),
(126, 'Maps', 'com.google.android.apps.maps', '25.11.01.735126028', 1067973246, 'הורידו את הגרסה האחרונה של מפות Google', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.maps_icon_1755796377.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/Maps_1755796377.apk', 99.05, '2025-08-21', '2025-08-21 17:12:57', '2025-08-21 17:12:57', 3.9),
(127, 'Messages', 'com.google.android.apps.messaging', 'messages.android_20250311_04_RC01.phone_dynamic', 273168063, '‏אפליקציית הודעות פשוטה וחכמה מבית Google', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.google.android.apps.messaging_icon_1755796385.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/PrebuiltBugle_1755796385.apk', 157.03, '2025-08-21', '2025-08-21 17:13:05', '2025-08-21 17:13:05', 2.9),
(128, 'כללית', 'clalit.android', '10.20.21417', 102021417, 'איזה כיף! אנחנו שמחים להשיק את אפליקציית כללית החדשה והמפתיעה.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/clalit.android_icon_1755868101.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/clalit_10.20.21417_1755868101.apk', 108.22, '2025-08-22', '2025-08-22 13:08:21', '2025-08-22 13:08:21', 1.1),
(130, 'Camera', 'photo.camera.hdcameras', '2.2', 4, 'APK upload from APK Info Extractor', 9, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/ic_launcher_camera_1755868565.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/cam_1755868565.apk', 8.68, '2025-08-22', '2025-08-22 13:16:05', '2025-08-22 13:16:05', 3),
(131, 'CamScanner', 'com.intsig.camscanner', '6.92.5.2507170000', 69251, 'סרוק קובץ, ערוך PDF, המר פורמט, הכר טקסט', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.intsig.camscanner_icon_1755868695.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/CamScanner_6.92.5.2507170000_1755868695.apks', 130.60, '2025-08-22', '2025-08-22 13:18:15', '2025-08-22 13:18:15', 3.1),
(132, 'GitHub', 'com.github.android', '1.221.1', 867, 'לשלוח התראות, סקור, הגב, ומזג, ישירות מהמכשיר הנייד שלך', 5, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.github.android_icon_1755868805.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/GitHub_1.221.1_1755868805.apks', 17.23, '2025-08-22', '2025-08-22 13:20:05', '2025-08-22 13:20:05', 2.7),
(134, 'בנק יהב', 'il.co.yahav.mobbanking', '1.0.159', 10159, 'בנק יהב מציג אפליקציה חדשה ומתקדמת לניהול החשבון בסלולר.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/il.co.yahav.mobbanking_icon_1756025267.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/il.co.yahav.mobbanking_10159_1756025267.apk', 41.77, '2025-08-24', '2025-08-24 08:47:47', '2025-08-24 08:47:47', 4.4),
(135, 'בנק ירושלים', 'com.bankjerusalem', '112.2', 117, 'אפליקציית בנק ירושלים מאפשרת לך לנהל את חשבונך בקלות ובנוחות.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.bankjerusalem_icon_1756025563.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.bankjerusalem_117_1756025563.apks', 85.42, '2025-08-24', '2025-08-24 08:52:43', '2025-08-24 08:52:43', 0),
(137, 'פאג\\\"י', 'com.pagi.nativeapp', '6.44.8.21', 306, 'פאגי מציגים חוויה ייחודית וחדשנית לניהול חשבונך.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.pagi.nativeapp_icon_1756025679.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.pagi.nativeapp_306_1756025678.apks', 108.13, '2025-08-24', '2025-08-24 08:54:39', '2025-08-24 08:54:39', 0),
(138, 'מסד', 'com.masad.nativeapp', '6.44.8.4', 305, 'בנק מסד מציג חוויה ייחודית וחדשנית לניהול חשבונך.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.masad.nativeapp_icon_1756026094.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.masad.nativeapp_305_1756026094.apks', 110.27, '2025-08-24', '2025-08-24 09:01:34', '2025-08-24 09:01:34', 0),
(139, 'בנק יהב - שוק ההון', 'il.co.yahav.mobtrading', '1.0.38', 38, 'בנק יהב מציג אפליקציה חדשה למסחר בשוק ההון באמצעות הסלולר.', 3, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/il.co.yahav.mobtrading_icon_1756027045.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/il.co.yahav.mobtrading_38_1756027045.apk', 12.40, '2025-08-24', '2025-08-24 09:17:25', '2025-08-24 09:17:25', 0),
(140, 'כולל - יהדות, שיעורי תורה ועוד', 'org.kolel', '2.0.67', 363, 'צפייה בשיעורי תורה הכי עדכניים ממיטב הרבנים, המרצים והארגונים בארץ ובעולם', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.kolel_icon_1756027206.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.kolel_363_1756027205.apks', 27.91, '2025-08-24', '2025-08-24 09:20:06', '2025-08-24 09:20:06', 0),
(141, 'Sefaria - ספריא', 'org.sefaria.sefaria', '6.4.57', 62061014, 'ספריא היא ספריה חיה של טקסטים יהודיים', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.sefaria.sefaria_icon_1756027336.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.sefaria.sefaria_62061014_1756027336.apks', 16.67, '2025-08-24', '2025-08-24 09:22:16', '2025-08-24 09:22:16', 4.5),
(142, 'יומי', 'il.org.yomi.app', '1.0.8', 8, 'יומי מבית וידעת היום - למידה חווייתית וקלילה של הגמרא', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/il.org.yomi.app_icon_1756028746.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/il.org.yomi.app_8_1756028746.apks', 1.57, '2025-08-24', '2025-08-24 09:45:46', '2025-08-24 09:45:46', 0),
(143, 'Chabad.org', 'org.chabad.mobile', '0.9.4', 241015001, 'Chabad.org, האתר היהודי הגדול ביותר.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.chabad.mobile_icon_1756028749.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.chabad.mobile_241015001_1756028749.apks', 4.51, '2025-08-24', '2025-08-24 09:45:49', '2025-08-24 09:45:49', 4.7),
(144, 'הרב אהרון לוי', 'com.communityapp.ravlevi', '1.1.2', 23, 'האפליקציה הרשמית של הרב אהרון לוי', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.communityapp.ravlevi_icon_1756028752.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.communityapp.ravlevi_23_1756028752.apks', 14.11, '2025-08-24', '2025-08-24 09:45:52', '2025-08-24 09:45:52', 5),
(145, 'Omer Counter', 'org.chabad.OmerCounter', '3.0.9', 2025042504, 'קבל תזכורות עומר, ברכות עומר, מדיטציות יומיות ועוד', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.chabad.OmerCounter_icon_1756028755.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.chabad.OmerCounter_2025042504_1756028755.apks', 16.42, '2025-08-24', '2025-08-24 09:45:55', '2025-08-24 09:45:55', 4.2),
(146, 'מאגר השו\"ת', 'com.luz.asktherabbi', '2.3', 13, 'אלפי פסקי הלכה, עם מנגנון חיפוש משוכלל. תוכלו גם לשלוח שאלות ולקבל מענה מיידי.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.luz.asktherabbi_icon_1756028758.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.luz.asktherabbi_13_1756028758.apks', 15.51, '2025-08-24', '2025-08-24 09:45:58', '2025-08-24 09:45:58', 4.9),
(147, 'לימוד יומי', 'tltk.production.hatat', '17.0.0', 23, 'לימוד יומי מכל מקום', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/tltk.production.hatat_icon_1756028761.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/tltk.production.hatat_23_1756028761.apks', 16.98, '2025-08-24', '2025-08-24 09:46:01', '2025-08-24 09:46:01', 0),
(148, 'שטיינזלץ - לימוד יומי', 'app.steinsaltz.study', '2.2.2', 195, 'האפלקיציה ללימוד יומי של שטיינזלץ מנגישה ומשדרגת את חוויית הלימוד היומי', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/app.steinsaltz.study_icon_1756028764.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/app.steinsaltz.study_195_1756028764.apks', 26.07, '2025-08-24', '2025-08-24 09:46:04', '2025-08-24 09:46:04', 4.4),
(149, 'הדף היומי', 'com.mogy.dafyomi', '1.19.80', 430, 'שיעורי שמע על הדף היומי, צורת הדף, מאמרים ותכנים רבים, מילון ארמי עברי, ועוד.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.mogy.dafyomi_icon_1756028765.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.mogy.dafyomi_430_1756028765.apk', 35.14, '2025-08-24', '2025-08-24 09:46:05', '2025-08-24 09:46:05', 4.9),
(150, 'TorahAnytime', 'com.torahanytime.betaapp', '3.3.32', 530030332, 'גישה מיידית לשיעורי תורני וידאו ואודיו.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.torahanytime.betaapp_icon_1756028766.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.torahanytime.betaapp_530030332_1756028765.apks', 20.17, '2025-08-24', '2025-08-24 09:46:06', '2025-08-24 09:46:06', 4.9),
(152, 'iTorah: Watch, Listen & Stream', 'com.itorah.app', '1.1.15', 51, 'זמין בכל מקום שאתה נמצא, iTorah מביאה את הלמידה לקצות אצבעותיך.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.itorah.app_icon_1756028769.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.itorah.app_51_1756028769.apks', 27.24, '2025-08-24', '2025-08-24 09:46:09', '2025-08-24 09:46:09', 4.8),
(153, 'חדשות חרדים - יהדות משפחה ועוד', 'com.briox.riversip.android.tapuz_news.religious', '5.6.2', 11805, 'מיטב העיתונים החרדים במקום אחד!', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.briox.riversip.android.tapuz_news.religious_icon_1756028770.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.briox.riversip.android.tapuz_news.religious_11805_1756028770.apk', 38.53, '2025-08-24', '2025-08-24 09:46:10', '2025-08-24 09:46:10', 4.8),
(154, 'תלמוד ירושלמי', 'com.talmudyerushalmi.studycommentary', '3.7.5', 30705, 'אפליקציית תלמוד ירושלמי חינמית לשירות הציבור עם פרשנים ועוד.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.talmudyerushalmi.studycommentary_icon_1756028781.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.talmudyerushalmi.studycommentary_30705_1756028781.apks', 41.43, '2025-08-24', '2025-08-24 09:46:21', '2025-08-24 09:46:21', 4.6),
(156, 'קידום', 'com.kidum_reactnative', '2.5.12', 200455, 'אפליקציה ללימוד פסיכומטרי - תרגול אוצר מילים בעברית ובאנגלית וסרטוני שיעורים', 6, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.kidum_reactnative_icon_1756028802.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.kidum_reactnative_200455_1756028801.apk', 122.09, '2025-08-24', '2025-08-24 09:46:42', '2025-08-24 09:46:42', 0),
(157, 'Aleph Beta: Torah Videos', 'org.alephbeta.android', '4.6.0', 290, 'להתאהב בתורה', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.alephbeta.android_icon_1756028803.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.alephbeta.android_290_1756028803.apk', 59.22, '2025-08-24', '2025-08-24 09:46:43', '2025-08-24 09:46:43', 4.5),
(158, 'מד צעדים', 'com.tayu.tau.pedometer', '5.52', 75, 'פשוט לוקחים את הטלפון החכם להליכה כדי להשתמש', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.tayu.tau.pedometer_icon_1756028914.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.tayu.tau.pedometer_75_1756028914.apks', 10.34, '2025-08-24', '2025-08-24 09:48:34', '2025-08-24 09:48:34', 4.8),
(162, 'סופר צעדים - צעדים , מד צעדים', 'pedometer.steptracker.calorieburner.stepcounter', '1.5.8', 145, 'סופר צעדים יומי, פדומטר ומחשב קלוריות🔥 קל לשימוש וחינמי לסיוע בהורדה במשקל', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/pedometer.steptracker.calorieburner.stepcounter_icon_1756028932.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/pedometer.steptracker.calorieburner.stepcounter_145_1756028932.apks', 16.32, '2025-08-24', '2025-08-24 09:48:52', '2025-08-24 09:48:52', 4.9),
(163, 'היהודי החכם', 'com.thewisejewish', '2.1.13', 21130, 'מה שיהודי צריך במכשיר החכם - ספריה עשירה ללימוד תורה כלים ללימוד ואינדקס מקומות.', 2, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.thewisejewish_icon_1756028937.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.thewisejewish_21130_1756028937.apks', 71.83, '2025-08-24', '2025-08-24 09:48:57', '2025-08-24 09:48:57', 4.7),
(164, 'WOW מאוחדת', 'co.il.move_club.meuhedetwow', '0.0.34', 44, 'למה סתם לעשות ספורט, אם אפשר לעשות ספורט ולקבל על זה הטבות?', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/co.il.move_club.meuhedetwow_icon_1756028939.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/co.il.move_club.meuhedetwow_44_1756028939.apks', 40.93, '2025-08-24', '2025-08-24 09:48:59', '2025-08-24 09:48:59', 2.2),
(165, 'Weight Loss Walking: WalkFit', 'com.walkfit.weightloss.steptracker.pedometer', '2.89.0', 185470, 'אפליקציית הליכה לירידה במשקל: גשש הליכה וצעדים, מד צעדים, הליכון מקורה', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.walkfit.weightloss.steptracker.pedometer_icon_1756028939.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.walkfit.weightloss.steptracker.pedometer_185470_1756028939.apks', 48.43, '2025-08-24', '2025-08-24 09:48:59', '2025-08-24 09:48:59', 4.6),
(166, 'חמ\"ל - חדשות מתפרצות בזמן אמת', 'com.walla.wallahamal', '3.0.23', 172, 'חמל, כל העדכונים והדיווחים הראשוניים מהשטח לפני כולם - כולל התרעות \"צבע אדום\".', 5, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.walla.wallahamal_icon_1756028941.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.walla.wallahamal_172_1756028941.apks', 34.81, '2025-08-24', '2025-08-24 09:49:01', '2025-08-24 09:49:01', 3.1),
(167, 'iHerb: ויטמינים ותוספי תזונה', 'com.iherb', '11.8.0807', 882, 'תוספי תזונה, מוצרי בריאות וטיפוח אישי, תזונת ספורט ועוד!', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.iherb_icon_1756028949.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.iherb_882_1756028949.apks', 52.64, '2025-08-24', '2025-08-24 09:49:09', '2025-08-24 09:49:09', 4.8),
(168, 'מכבי שירותי בריאות', 'com.ideomobile.maccabi', '3.59.0', 366, 'אפליקציית מכבי שירותי בריאות מאפשרת צפייה במידע וביצוע פעולות עבורך ועבור המשפחה', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.ideomobile.maccabi_icon_1756028951.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.ideomobile.maccabi_366_1756028951.apks', 48.80, '2025-08-24', '2025-08-24 09:49:11', '2025-08-24 09:49:11', 2.7),
(169, 'Health Diary by MedM', 'com.medm.app.health', '3.5.1080', 584, 'יומן בריאות המשפחה: לחץ דם, משקל, טמפרטורה, גלוקוז, פעילות, שינה', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.medm.app.health_icon_1756028960.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.medm.app.health_584_1756028960.apks', 78.73, '2025-08-24', '2025-08-24 09:49:20', '2025-08-24 09:49:20', 4.5),
(170, 'מאוחדת', 'org.meuhedet.android', '4.6.0', 298, 'ברוכים הבאים לאפליקציה החדשה של מאוחדת\nקחו את שירותי האונליין שלנו אתכם לכל מקום', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/org.meuhedet.android_icon_1756028962.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/org.meuhedet.android_298_1756028962.apks', 72.81, '2025-08-24', '2025-08-24 09:49:22', '2025-08-24 09:49:22', 3.3),
(171, 'Withings', 'com.withings.wiscale2', '7.6.1', 7060101, 'הקשר לבריאות שלך', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.withings.wiscale2_icon_1756028980.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.withings.wiscale2_7060101_1756028980.apks', 97.38, '2025-08-24', '2025-08-24 09:49:40', '2025-08-24 09:49:40', 4.4),
(172, 'OHealth', 'com.heytap.health.international', '4.33.4_cb93fc0_250807', 43304, 'אפליקציית בריאות וכושר שיכולה להתאים מכשירים לבישים חכמים של OPPO ו-OnePlus.', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.heytap.health.international_icon_1756029001.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.heytap.health.international_43304_1756029001.apk', 178.29, '2025-08-24', '2025-08-24 09:50:01', '2025-08-24 09:50:01', 4.2),
(174, 'מעקב צעדים - מד צעדים , צעדים', 'steptracker.healthandfitness.walkingtracker.pedometer', '1.5.8', 113, 'מעקב צעדים יומי, מד צעדים בחינם ומעקב במפה לחישוב צעדים וקלוריות.', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/steptracker.healthandfitness.walkingtracker.pedometer_icon_1756029072.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/steptracker.healthandfitness.walkingtracker.pedometer_113_1756029072.apks', 17.12, '2025-08-24', '2025-08-24 09:51:12', '2025-08-24 09:51:12', 4.8),
(175, 'מזרחי טפחות - ניהול חשבון', 'com.MizrahiTefahot.nh', '40.0', 3000066, 'מלבד השירות הטוב שאנו מציעים, קיימים מידע ופעולות באפליקציה שלנו שחשוב שתכירו', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.MizrahiTefahot.nh_icon_1756029073.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.MizrahiTefahot.nh_3000066_1756029073.apks', 39.31, '2025-08-24', '2025-08-24 09:51:13', '2025-08-24 09:51:13', 3.1),
(176, 'Fitbit', 'com.fitbit.FitbitMobile', '4.49.fitbit-mobile-110368637-793698166', 110368637, 'Fitbit מחויבת לסייע לאנשים לחיות חיים בריאים יותר, פעילים יותר.', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.fitbit.FitbitMobile_icon_1756029078.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.fitbit.FitbitMobile_110368637_1756029078.apks', 29.15, '2025-08-24', '2025-08-24 09:51:18', '2025-08-24 09:51:18', 4.1),
(177, 'MyFitnessPal: Calorie Counter', 'com.myfitnesspal.android', '25.32.0', 44626, 'עקוב אחר פקודות המאקרו, התזונה, מעקב המאקרו ותכנון הארוחות שלך', 6, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.myfitnesspal.android_icon_1756029085.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.myfitnesspal.android_44626_1756029085.apks', 56.93, '2025-08-24', '2025-08-24 09:51:25', '2025-08-24 09:51:25', 4.4),
(178, 'bit ביט', 'com.bnhp.payments.paymentsapp', '6.6.1', 432, 'bit - אפליקציה חדשנית להעברת כסף, מעבירים כסף בקלות ובמהירות לאנשי הקשר בטלפון.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.bnhp.payments.paymentsapp_icon_1756029105.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.bnhp.payments.paymentsapp_432_1756029105.apk', 88.87, '2025-08-24', '2025-08-24 09:51:45', '2025-08-24 09:51:45', 4.7),
(179, 'בנק הפועלים - פועלים PASS', 'com.bnhp.passapp', '1.6.1', 28, 'אפליקציית פועלים PASS מפיקה קוד הזדהות חד פעמי הנדרש לכניסה לחשבונך העסקי בבנק.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.bnhp.passapp_icon_1756029120.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.bnhp.passapp_28_1756029120.apk', 51.67, '2025-08-24', '2025-08-24 09:52:00', '2025-08-24 09:52:00', 0),
(180, 'My Health', 'com.transsion.healthlife', '4.21.1.4', 4021004, 'עוזר בריאות מהנה ומקצועי שאפשר לסמוך עליו', 7, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.transsion.healthlife_icon_1756029121.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.transsion.healthlife_4021004_1756029121.apks', 93.31, '2025-08-24', '2025-08-24 09:52:01', '2025-08-24 09:52:01', 4.2),
(181, 'Bankin\' : Gestion de budget', 'com.bankeen', '4.51.6', 45106535, 'Bankin\' - אפליקציית ניהול הכסף שמפשטת את חיי היומיום שלך', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.bankeen_icon_1756029129.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.bankeen_45106535_1756029129.apks', 48.53, '2025-08-24', '2025-08-24 09:52:09', '2025-08-24 09:52:09', 4.2),
(184, 'בנק הפועלים - פועלים לעסקים', 'com.bnhp.businessapp', '9.1.2', 283, 'האפליקציה החדשה של בנק הפועלים ללקוחות העסקיים -  \"פועלים לעסקים\".', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.bnhp.businessapp_icon_1756029142.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.bnhp.businessapp_283_1756029142.apk', 85.40, '2025-08-24', '2025-08-24 09:52:22', '2025-08-24 09:52:22', 3.2),
(185, 'בנק הפועלים - מסחר בשוק ההון', 'com.ideomobile.hmarket', '13.0', 290, 'אפליקציית המסחר בשוק ההון של בנק הפועלים מתחדשת במגוון כלים מתקדמים.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.ideomobile.hmarket_icon_1756029155.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.ideomobile.hmarket_290_1756029154.apk', 75.30, '2025-08-24', '2025-08-24 09:52:35', '2025-08-24 09:52:35', 4.3),
(186, 'הבנק הבינלאומי', 'com.fibi.nativeapp', '6.44.8.4', 305, 'הבנק הבינלאומי מציג חוויה ייחודית וחדשנית לניהול חשבונך.', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.fibi.nativeapp_icon_1756029162.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.fibi.nativeapp_305_1756029162.apks', 111.26, '2025-08-24', '2025-08-24 09:52:42', '2025-08-24 09:52:42', 3.7),
(188, 'בנק דיסקונט', 'com.ideomobile.discount', '92.0.2', 5463, 'אפליקציית בנק דיסקונט מאפשרת לצפות במידע ולבצע פעולות בחשבון בקלות ובנוחות', 1, 'https://ikosher.me/iFilter/AppsCenter/uploads/images/com.ideomobile.discount_icon_1756029165.png', 'https://ikosher.me/iFilter/AppsCenter/uploads/apk/com.ideomobile.discount_5463_1756029165.apks', 132.95, '2025-08-24', '2025-08-24 09:52:45', '2025-08-24 09:52:45', 3.5);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `category_plan_availability`
--

CREATE TABLE `category_plan_availability` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `category_plan_availability`
--

INSERT INTO `category_plan_availability` (`id`, `category_id`, `plan_id`, `created_at`) VALUES
(11, 2, 2, '2025-05-08 11:05:16'),
(12, 2, 3, '2025-05-08 11:05:16'),
(13, 8, 2, '2025-05-08 13:09:05'),
(16, 7, 1, '2025-07-21 12:01:46'),
(17, 7, 2, '2025-07-21 12:01:46'),
(19, 1, 2, '2025-07-21 12:02:10'),
(20, 5, 2, '2025-08-22 13:21:42');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `imei` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `android_version` varchar(20) DEFAULT NULL,
  `deviceID` varchar(100) DEFAULT NULL,
  `registration_date` timestamp NULL DEFAULT current_timestamp(),
  `plan_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `last_sync` datetime DEFAULT NULL,
  `client_unique_id` int(11) NOT NULL,
  `plan_start_date` datetime DEFAULT NULL,
  `plan_expiry_date` datetime DEFAULT NULL,
  `plan_status` enum('trial','active','expired','suspended','pending') DEFAULT 'pending',
  `last_payment_date` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `trial_started_date` datetime DEFAULT NULL,
  `trial_expiry_date` datetime DEFAULT NULL,
  `trial_status` enum('not_started','active','expired','converted') DEFAULT 'not_started',
  `client_level_id` int(11) DEFAULT 1,
  `points_balance` int(11) DEFAULT 15,
  `points_last_reset` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `clients`
--

INSERT INTO `clients` (`id`, `imei`, `phone`, `first_name`, `last_name`, `model`, `android_version`, `deviceID`, `registration_date`, `plan_id`, `email`, `last_sync`, `client_unique_id`, `plan_start_date`, `plan_expiry_date`, `plan_status`, `last_payment_date`, `payment_method`, `payment_reference`, `trial_started_date`, `trial_expiry_date`, `trial_status`, `client_level_id`, `points_balance`, `points_last_reset`) VALUES
(1, '12345678902345', '0501234567', 'David', 'Cohen', 'Samsung A52', '11', 'device001', '2024-08-15 00:00:00', 2, NULL, '2025-05-10 23:15:01', 4151, '2025-07-06 12:38:33', '2025-07-10 12:38:45', 'trial', NULL, NULL, NULL, '2025-07-02 12:24:02', '2025-07-04 12:24:02', 'active', 1, 15, '2025-07-30 12:19:07'),
(2, '987654321098765', '0527654321', 'Sarah', 'Levi', 'Xiaomi Redmi Note 9', '10', 'device002', '2024-08-16 00:00:00', 3, NULL, NULL, 3236, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, 'not_started', 1, 15, '2025-07-30 12:19:07'),
(3, '456789123456789', '0539876543', 'Moshe', 'Rosen', 'Pixel 6', '12', 'device003', '2024-08-17 00:00:00', 2, NULL, NULL, 5656, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, 'not_started', 1, 15, '2025-07-30 12:19:07'),
(43, '333333233', '', '', '', 'SM-G998B', '14', '0b9f9d878568ed52', '2025-06-27 13:47:38', 3, 'itapiatu13@gmail.com', NULL, 260429388, NULL, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, 'not_started', 1, 15, '2025-07-30 12:19:07'),
(49, '356789123456789', '0501234567', '', '', 'Samsung Galaxy S21', '13', 'android-device-id-1234', '2025-07-10 06:25:01', 1, 'user@example.com', NULL, 714606732, NULL, '2026-07-01 13:55:39', 'pending', NULL, NULL, NULL, NULL, NULL, 'not_started', 1, 0, '2025-07-30 12:19:07'),
(57, '3333333339', '', '', '', 'QIN3ULTRAll', '12', '19981694e666d2e0dkkkk', '2025-08-07 12:19:59', 2, 'amheching@gmail.com', NULL, 875917007, '2025-08-07 12:30:36', '2026-08-07 12:30:36', 'active', '2025-08-07 12:30:36', 'manual', NULL, '2025-08-07 12:19:59', '2025-08-12 12:19:59', 'converted', 1, 15, '2025-08-07 12:19:59'),
(58, '3331333333', '450454545454', 'dfasdsad', '', 'QIN3ULTRA', '12', 'c60e7b64900566f3', '2025-08-12 15:13:22', 2, 'anar@gmail.com', NULL, 260439388, NULL, NULL, 'pending', NULL, NULL, NULL, '2025-08-12 15:13:22', '2025-08-20 15:13:22', 'active', 1, 11, '2025-08-12 15:13:22'),
(59, '333333333', '05078976', 'hh', 'jjk', 'F22 Pro', '12', '9d780813154a69b0', '2025-08-23 19:59:34', 2, 'david@gm.com', NULL, 549796186, NULL, NULL, 'pending', NULL, NULL, NULL, '2025-08-23 19:59:34', '2025-08-30 19:59:34', 'active', 1, 13, '2025-08-23 19:59:34');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `client_apps`
--

CREATE TABLE `client_apps` (
  `app_id` int(11) NOT NULL,
  `first_seen_at` timestamp NULL DEFAULT current_timestamp(),
  `last_seen_at` timestamp NULL DEFAULT current_timestamp(),
  `client_unique_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `client_apps`
--

INSERT INTO `client_apps` (`app_id`, `first_seen_at`, `last_seen_at`, `client_unique_id`) VALUES
(1, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 3236),
(5, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 3236),
(6, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 3236),
(1, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 4151),
(2, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 4151),
(3, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 4151),
(4, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 4151),
(10, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(46, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(47, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(48, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(49, '2025-05-10 20:14:20', '2025-05-10 20:14:20', 4151),
(50, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(51, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(52, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(53, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(54, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(55, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(56, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(57, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(58, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(59, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(60, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(61, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(62, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(63, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(64, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(65, '2025-05-10 20:14:20', '2025-05-10 20:15:01', 4151),
(1, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 5656),
(9, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 5656),
(10, '2025-05-09 13:53:02', '2025-05-09 13:53:02', 5656);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `client_levels`
--

CREATE TABLE `client_levels` (
  `id` int(11) NOT NULL,
  `level_name` varchar(50) NOT NULL,
  `level_order` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `client_levels`
--

INSERT INTO `client_levels` (`id`, `level_name`, `level_order`, `description`, `created_at`) VALUES
(1, 'public', 1, 'Available to all users', '2025-07-27 09:35:39'),
(2, 'beta', 2, 'Available to beta testers and above', '2025-07-27 09:35:39'),
(3, 'elite', 3, 'Available to elite users only', '2025-07-27 09:35:39');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `custom_plan_selected_apps`
--

CREATE TABLE `custom_plan_selected_apps` (
  `id` int(11) NOT NULL,
  `client_unique_id` int(11) NOT NULL,
  `app_id` int(11) NOT NULL,
  `selected_date` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `product_device` varchar(100) DEFAULT NULL,
  `build_fingerprint` text DEFAULT NULL,
  `android_version` varchar(20) DEFAULT NULL,
  `patched_boot_url` text DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `devices`
--

INSERT INTO `devices` (`id`, `product_device`, `build_fingerprint`, `android_version`, `patched_boot_url`, `timestamp`) VALUES
(1, 'redfin', 'google/redfin/redfin:13/TQ3A.230805.001/10008900:user/release-keys', '13', 'https://yourserver.com/boot_images/redfin_13_TQ3A_patched.img', '2025-06-03 05:47:14'),
(2, 'oriole', 'google/oriole/oriole:14/AP1A.240405.002/12345678:user/release-keys', '14', 'https://yourserver.com/boot_images/oriole_14_AP1A_patched.img', '2025-06-03 05:47:14'),
(3, 'x1q', 'samsung/x1qxx/x1q:13/TP1A.220624.014/G981BXXU8HWG1:user/release-keys', '13', 'https://yourserver.com/boot_images/x1q_13_G981B_patched.img', '2025-06-03 05:47:14');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `filtering_plans`
--

CREATE TABLE `filtering_plans` (
  `plan_id` int(11) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `price` varchar(50) NOT NULL,
  `feature1` varchar(255) NOT NULL,
  `feature2` varchar(255) NOT NULL,
  `feature3` varchar(255) NOT NULL,
  `plan_key` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `filtering_plans`
--

INSERT INTO `filtering_plans` (`plan_id`, `plan_name`, `image_url`, `price`, `feature1`, `feature2`, `feature3`, `plan_key`) VALUES
(1, 'מסלול בסיסי ', 'https://ikosher.me/good_morning_img.png', '₪19.99 לחודש', 'סינון אתרים בסיסי', 'חסימת תכנים', 'חיפוש בטוח', 'basic_plan'),
(2, 'מסלול פרימיום', 'https://ikosher.me/test.jpg', '₪39.99 לחודש', 'סינון מתקדם', 'חסימת סרטונים', 'הגבלת אפליקציות', 'premium_plan'),
(3, 'מסלול אישי', 'https://ikosher.me/1748334143.1259.jpg', '₪29.99 לחודש', 'שליטה מלאה בהתאמה אישית', 'גמישות וניהול פשוט', 'סינון מדויק לפי צרכים אישיים', 'custom_plan');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `magisk_modules`
--

CREATE TABLE `magisk_modules` (
  `id` int(11) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `version` varchar(20) NOT NULL,
  `download_url` varchar(500) NOT NULL,
  `client_level_id` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `reboot_required` enum('required','force','none') NOT NULL DEFAULT 'required',
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `magisk_modules`
--

INSERT INTO `magisk_modules` (`id`, `module_name`, `version`, `download_url`, `client_level_id`, `description`, `created_at`, `updated_at`, `created_by`, `reboot_required`, `is_active`) VALUES
(1, 'iFilter_hosts', '1', 'https://ikosher.me/iFilter/modules/hosts.zip', 1, 'Hosts file filtering module', '2025-07-27 11:43:25', '2025-08-23 19:58:06', NULL, 'required', 0),
(2, 'iFilter_certs', '2', 'https://ikosher.me/iFilter/modules/netfree14.zip', 1, 'Certificate management module', '2025-07-27 11:43:25', '2025-08-14 07:11:48', NULL, 'required', 1),
(3, 'zygisk_lsposed', '7186', 'https://ikosher.me/iFilter/modules/lsposed.zip', 1, 'LSPosed framework module', '2025-07-27 11:43:25', '2025-08-12 15:16:12', NULL, 'required', 1),
(4, 'iFilter_services', '9', 'https://ikosher.me/iFilter/modules/services.zip', 1, 'Core services module', '2025-07-27 11:43:25', '2025-08-23 19:41:42', NULL, 'required', 1);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `otp_verifications`
--

CREATE TABLE `otp_verifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `identifier_type` enum('email','phone') NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `otp_verifications`
--

INSERT INTO `otp_verifications` (`id`, `identifier`, `identifier_type`, `otp_code`, `expires_at`, `is_used`, `created_at`) VALUES
(175, 'itapiatu12@gmail.com', 'email', '531674', '2025-06-27 13:40:59', 1, '2025-06-27 13:30:59'),
(176, 'itapiatu12@gmail.com', 'email', '791844', '2025-06-27 13:53:57', 1, '2025-06-27 13:43:57'),
(177, 'itapiatu12@gmail.com', 'email', '913146', '2025-06-27 13:56:46', 1, '2025-06-27 13:46:46'),
(178, 'itapiatu12@gmail.com', 'email', '322391', '2025-06-30 07:22:36', 1, '2025-06-30 07:12:36'),
(179, 'itapiatu12@gmail.com', 'email', '924535', '2025-06-30 07:34:05', 1, '2025-06-30 07:24:05'),
(180, 'itapiatu12@gmail.com', 'email', '764259', '2025-06-30 07:37:48', 1, '2025-06-30 07:27:48'),
(181, 'itapiatu12@gmail.com', 'email', '999282', '2025-06-30 07:40:59', 1, '2025-06-30 07:30:59'),
(182, 'itapiatu12@gmail.com', 'email', '623375', '2025-06-30 07:55:07', 1, '2025-06-30 07:45:07'),
(183, 'itapiatu14@gmail.com', 'email', '027267', '2025-08-01 08:18:01', 1, '2025-08-01 08:08:01'),
(184, 'itapiatu1t@gmail.com', 'email', '089971', '2025-08-03 11:41:19', 1, '2025-08-03 11:31:19'),
(185, 'amos@gmail.com', 'email', '070749', '2025-08-07 12:25:22', 0, '2025-08-07 12:15:22'),
(186, 'amheching@gmail.com', 'email', '460351', '2025-08-07 12:25:59', 1, '2025-08-07 12:15:59'),
(187, 'itapiatu12@gmail.com', 'email', '078031', '2025-08-12 15:22:03', 1, '2025-08-12 15:12:03'),
(188, 'david@gm.com', 'email', '884776', '2025-08-23 20:08:47', 1, '2025-08-23 19:58:47');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `remote_commands`
--

CREATE TABLE `remote_commands` (
  `command_id` int(11) NOT NULL,
  `client_unique_id` int(11) NOT NULL,
  `command_type` enum('FILTER_UPDATE','UNINSTALL_APP','INSTALL_APP','RESTART','LOCK_DEVICE') NOT NULL,
  `command_data` text DEFAULT NULL,
  `status` enum('PENDING','EXECUTED','FAILED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `executed_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `remote_commands`
--

INSERT INTO `remote_commands` (`command_id`, `client_unique_id`, `command_type`, `command_data`, `status`, `created_at`, `executed_at`, `error_message`) VALUES
(1, 260429388, 'UNINSTALL_APP', 'com.example.badapp', 'EXECUTED', '2025-06-30 08:49:05', '2025-06-30 11:53:41', NULL);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `client_unique_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('open','closed') DEFAULT 'open',
  `points_spent` tinyint(1) DEFAULT 0,
  `assigned_to` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `closed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `tickets`
--

INSERT INTO `tickets` (`id`, `client_unique_id`, `subject`, `description`, `status`, `points_spent`, `assigned_to`, `created_at`, `closed_at`) VALUES
(33, 875917007, 'app_upload', 'שלום רב,\n\nשמי איתמר ואני מפתח אפליקציה המיועדת לסביבת שימוש בטוחה למכשירים ניידים. אני מעוניין לשלב מנגנון סינון תוכן מתקדם בתוך האפליקציה שלי, שיכלול סינון של אתרים, מדיה ותכנים לא מתאימים. אשמח לשמוע על הפתרונות שאתם מציעים, יכולות ההתאמה לצרכים ספציפיים, ותנאי השילוב או הרישוי. כמו כן, מעניין אותי להבין כיצד ניתן להבטיח שמנגנון הסינון יהיה מהיר, אמין ובטוח למשתמשים.\n\nתודה מראש על המענה,\nאיתמר', 'open', 0, NULL, '2025-08-07 12:23:03', NULL),
(34, 260439388, 'app_upload', 'plzzzz', 'open', 0, NULL, '2025-08-21 09:13:07', NULL),
(35, 260439388, 'report', 'ddddd', 'open', 0, NULL, '2025-08-21 09:46:37', NULL),
(36, 260439388, 'app_upload', 'שלום רב,\n\nשמי איתמר ואני מפתח אפליקציה המיועדת לסביבת שימוש בטוחה למכשירים ניידים. אני מעוניין לשלב מנגנון סינון תוכן מתקדם בתוך האפליקציה שלי, שיכלול סינון של אתרים, מדיה ותכנים לא מתאימים. אשמח לשמוע על הפתרונות שאתם מציעים, יכולות ההתאמה לצרכים ספציפיים, ותנאי השילוב או הרישוי. כמו כן, מעניין אותי להבין כיצד ניתן להבטיח שמנגנון הסינון יהיה מהיר, אמין ובטוח למשתמשים.\n\nתודה מראש על המענה,\nאיתמר', 'open', 3, NULL, '2025-08-21 09:57:26', NULL),
(37, 260439388, 'report', 'hhgfhgf', 'open', 1, NULL, '2025-08-21 10:09:40', NULL),
(38, 549796186, 'app_upload', 'היייי', 'open', 2, NULL, '2025-08-23 20:19:31', NULL);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `ticket_updates`
--

CREATE TABLE `ticket_updates` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `updated_by` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `user_type` enum('client','user') NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- הוצאת מידע עבור טבלה `ticket_updates`
--

INSERT INTO `ticket_updates` (`id`, `ticket_id`, `updated_by`, `message`, `created_at`, `user_type`) VALUES
(30, 33, 875917007, 'נו מה קורה עם זה באמת??', '2025-08-07 12:23:25', 'client');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `user_type` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `first_name`, `last_name`, `user_type`, `created_at`, `updated_at`) VALUES
(1, 'itapi', '$2y$10$.6Nt3dTiZLWZ7D5uZ7yG1.DOxxRyUl87YSsuqANU4N4mIE7nQivre', 'Itamar', 'Yehezkel', 'admin', '2025-05-08 17:46:52', '2025-08-18 13:41:09');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `user_apps`
--

CREATE TABLE `user_apps` (
  `app_id` int(11) NOT NULL,
  `package_name` varchar(255) DEFAULT NULL,
  `app_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `user_apps`
--

INSERT INTO `user_apps` (`app_id`, `package_name`, `app_name`, `created_at`) VALUES
(1, 'com.whatsapp', 'WhatsApp', '2025-05-09 10:06:51'),
(2, 'com.facebook.katana', 'Facebook', '2025-05-09 10:06:51'),
(3, 'com.instagram.android', 'Instagram', '2025-05-09 10:06:51'),
(4, 'com.google.android.youtube', 'YouTube', '2025-05-09 10:06:51'),
(5, 'com.spotify.music', 'Spotify', '2025-05-09 10:06:51'),
(6, 'com.netflix.mediaclient', 'Netflix', '2025-05-09 10:06:51'),
(7, 'com.google.android.gm', 'Gmail', '2025-05-09 10:06:51'),
(8, 'com.amazon.mShop.android.shopping', 'Amazon Shopping', '2025-05-09 10:06:51'),
(9, 'com.tiktok.tiktok', 'TikTok', '2025-05-09 10:06:51'),
(10, 'com.waze', 'Waze', '2025-05-09 10:06:51'),
(46, 'com.unicell.pangoandroid', 'פנגו', '2025-05-10 20:14:20'),
(47, 'com.google.ar.core', 'Google Play Services for AR', '2025-05-10 20:14:20'),
(48, 'org.lsposed.manager', 'LSPosed', '2025-05-10 20:14:20'),
(49, 'com.woodslink.android.wiredheadphoneroutingfix', 'תיקון לסמל האוזנייה', '2025-05-10 20:14:20'),
(50, 'bin.mt.plus', 'MT Manager', '2025-05-10 20:14:20'),
(51, 'com.duoqin.ai', 'ניהול חשבונות', '2025-05-10 20:14:20'),
(52, 'com.google.android.apps.docs', 'Drive', '2025-05-10 20:14:20'),
(53, 'com.google.android.apps.maps', 'מפות', '2025-05-10 20:14:20'),
(54, 'com.google.android.contactkeys', 'Android System Key Verifier', '2025-05-10 20:14:20'),
(55, 'com.tranzmate', 'Moovit', '2025-05-10 20:14:20'),
(56, 'com.topjohnwu.magisk', 'Magisk', '2025-05-10 20:14:20'),
(57, 'com.google.android.apps.googlevoice', 'Voice', '2025-05-10 20:14:20'),
(58, 'com.iFilter.ManagerMainModule', 'viewModule', '2025-05-10 20:14:20'),
(59, 'com.android.qinstore', 'חנות יישומים', '2025-05-10 20:14:20'),
(60, 'com.TorahForum', 'פורום לתורה', '2025-05-10 20:14:20'),
(61, 'itapi.iKosher.Services', 'הגדרות iKosher', '2025-05-10 20:14:20'),
(62, 'com.google.android.safetycore', 'Android System SafetyCore', '2025-05-10 20:14:20'),
(63, 'com.androidlab.gpsfix', 'תיקון מיקום', '2025-05-10 20:14:20'),
(64, 'com.iFilter.UploaderUtility', 'Uploader', '2025-05-10 20:14:20'),
(65, 'itapi.iKosher.AppsCenter', 'מרכז היישומים', '2025-05-10 20:14:20');

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `xposed_modules`
--

CREATE TABLE `xposed_modules` (
  `id` int(11) NOT NULL,
  `package_name` varchar(255) NOT NULL,
  `module_name` varchar(255) NOT NULL,
  `version_name` varchar(50) DEFAULT NULL,
  `version_code` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `download_url` varchar(500) DEFAULT NULL,
  `client_level_id` int(11) NOT NULL DEFAULT 1,
  `reboot_required` enum('required','force','none') NOT NULL DEFAULT 'required',
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `xposed_modules`
--

INSERT INTO `xposed_modules` (`id`, `package_name`, `module_name`, `version_name`, `version_code`, `description`, `created_at`, `updated_at`, `download_url`, `client_level_id`, `reboot_required`, `is_active`) VALUES
(1, 'com.iFilter.BackgroundModule', 'Background Module', '1', 1, 'iFilter Background Module', '2025-07-14 07:55:45', '2025-08-14 09:08:50', 'https://ikosher.me/iFilter/xposedmodules/backgroundmodule.apk', 1, 'required', 1),
(2, 'com.iFilter.MainModule', 'Main Module', '1.0', 1, 'Main Ifiler module,for views and actiivies monitoring', '2025-07-29 09:06:07', '2025-08-14 09:10:11', 'https://ikosher.me/iFilter/dbhelper.php', 1, 'required', 0);

-- --------------------------------------------------------

--
-- מבנה טבלה עבור טבלה `xposed_module_scopes`
--

CREATE TABLE `xposed_module_scopes` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `scope_package_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- הוצאת מידע עבור טבלה `xposed_module_scopes`
--

INSERT INTO `xposed_module_scopes` (`id`, `module_id`, `scope_package_name`, `created_at`) VALUES
(1, 1, 'android', '2025-07-14 08:20:44'),
(2, 1, 'com.android.settings', '2025-07-14 08:20:44'),
(3, 2, 'com.example.app', '2025-07-29 09:13:01'),
(4, 1, 'com.whatsapp', '2025-07-29 09:13:12'),
(5, 1, 'com.android.systemui', '2025-07-29 09:17:42'),
(6, 2, 'com.instagram', '2025-07-29 09:17:56'),
(7, 2, 'com.unicell.pangoandroid', '2025-08-07 14:49:13'),
(8, 2, 'com.safecashapps', '2025-08-07 14:55:15'),
(9, 2, 'com.androidlab.gpsfix', '2025-08-17 08:09:48'),
(10, 2, 'com.whatsapp', '2025-08-18 17:42:58'),
(11, 2, 'com.stratumauth.app', '2025-08-19 04:20:08');

--
-- Indexes for dumped tables
--

--
-- אינדקסים לטבלה `apps_categories`
--
ALTER TABLE `apps_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `idx_unique_category_name` (`category_name`);

--
-- אינדקסים לטבלה `app_configs`
--
ALTER TABLE `app_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_config` (`package_name`,`config_type`),
  ADD KEY `client_level_id` (`client_level_id`);

--
-- אינדקסים לטבלה `app_store_apps`
--
ALTER TABLE `app_store_apps`
  ADD PRIMARY KEY (`app_id`),
  ADD UNIQUE KEY `unique_package_name` (`package_name`),
  ADD KEY `idx_apps_category` (`category_id`),
  ADD KEY `idx_package_name` (`package_name`);

--
-- אינדקסים לטבלה `category_plan_availability`
--
ALTER TABLE `category_plan_availability`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_plan` (`category_id`,`plan_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- אינדקסים לטבלה `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_client_id` (`client_unique_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_clients_plan_id` (`plan_id`),
  ADD KEY `client_level_id` (`client_level_id`);

--
-- אינדקסים לטבלה `client_apps`
--
ALTER TABLE `client_apps`
  ADD PRIMARY KEY (`client_unique_id`,`app_id`),
  ADD KEY `idx_client_apps_app` (`app_id`),
  ADD KEY `idx_client_apps_client_unique_id` (`client_unique_id`);

--
-- אינדקסים לטבלה `client_levels`
--
ALTER TABLE `client_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `level_name` (`level_name`),
  ADD UNIQUE KEY `level_order` (`level_order`);

--
-- אינדקסים לטבלה `custom_plan_selected_apps`
--
ALTER TABLE `custom_plan_selected_apps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_app` (`client_unique_id`,`app_id`),
  ADD KEY `idx_client_unique_id` (`client_unique_id`),
  ADD KEY `idx_app_id` (`app_id`);

--
-- אינדקסים לטבלה `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`);

--
-- אינדקסים לטבלה `filtering_plans`
--
ALTER TABLE `filtering_plans`
  ADD PRIMARY KEY (`plan_id`),
  ADD UNIQUE KEY `plan_key` (`plan_key`);

--
-- אינדקסים לטבלה `magisk_modules`
--
ALTER TABLE `magisk_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_module_level` (`module_name`,`client_level_id`),
  ADD KEY `idx_active_modules` (`client_level_id`),
  ADD KEY `idx_active_status` (`is_active`);

--
-- אינדקסים לטבלה `otp_verifications`
--
ALTER TABLE `otp_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `identifier` (`identifier`),
  ADD KEY `identifier_type` (`identifier_type`),
  ADD KEY `expires_at` (`expires_at`),
  ADD KEY `is_used` (`is_used`);

--
-- אינדקסים לטבלה `remote_commands`
--
ALTER TABLE `remote_commands`
  ADD PRIMARY KEY (`command_id`),
  ADD KEY `idx_client_status` (`client_unique_id`,`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- אינדקסים לטבלה `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `fk_tickets_client` (`client_unique_id`);

--
-- אינדקסים לטבלה `ticket_updates`
--
ALTER TABLE `ticket_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- אינדקסים לטבלה `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`);

--
-- אינדקסים לטבלה `user_apps`
--
ALTER TABLE `user_apps`
  ADD PRIMARY KEY (`app_id`),
  ADD UNIQUE KEY `package_name` (`package_name`);

--
-- אינדקסים לטבלה `xposed_modules`
--
ALTER TABLE `xposed_modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_modules_package_name` (`package_name`),
  ADD KEY `idx_xposed_client_level` (`client_level_id`),
  ADD KEY `idx_active_status` (`is_active`);

--
-- אינדקסים לטבלה `xposed_module_scopes`
--
ALTER TABLE `xposed_module_scopes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module_id` (`module_id`,`scope_package_name`),
  ADD KEY `idx_scopes_module_id` (`module_id`),
  ADD KEY `idx_scopes_package_name` (`scope_package_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `apps_categories`
--
ALTER TABLE `apps_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `app_configs`
--
ALTER TABLE `app_configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `app_store_apps`
--
ALTER TABLE `app_store_apps`
  MODIFY `app_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
-- AUTO_INCREMENT for table `category_plan_availability`
--
ALTER TABLE `category_plan_availability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `client_levels`
--
ALTER TABLE `client_levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `custom_plan_selected_apps`
--
ALTER TABLE `custom_plan_selected_apps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `filtering_plans`
--
ALTER TABLE `filtering_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `magisk_modules`
--
ALTER TABLE `magisk_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `otp_verifications`
--
ALTER TABLE `otp_verifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=189;

--
-- AUTO_INCREMENT for table `remote_commands`
--
ALTER TABLE `remote_commands`
  MODIFY `command_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `ticket_updates`
--
ALTER TABLE `ticket_updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_apps`
--
ALTER TABLE `user_apps`
  MODIFY `app_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `xposed_modules`
--
ALTER TABLE `xposed_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `xposed_module_scopes`
--
ALTER TABLE `xposed_module_scopes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- הגבלות לטבלאות שהוצאו
--

--
-- הגבלות לטבלה `app_configs`
--
ALTER TABLE `app_configs`
  ADD CONSTRAINT `app_configs_ibfk_1` FOREIGN KEY (`client_level_id`) REFERENCES `client_levels` (`id`);

--
-- הגבלות לטבלה `app_store_apps`
--
ALTER TABLE `app_store_apps`
  ADD CONSTRAINT `app_store_apps_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `apps_categories` (`category_id`) ON DELETE SET NULL;

--
-- הגבלות לטבלה `category_plan_availability`
--
ALTER TABLE `category_plan_availability`
  ADD CONSTRAINT `category_plan_availability_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `apps_categories` (`category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `category_plan_availability_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `filtering_plans` (`plan_id`) ON DELETE CASCADE;

--
-- הגבלות לטבלה `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`client_level_id`) REFERENCES `client_levels` (`id`),
  ADD CONSTRAINT `fk_client_plan` FOREIGN KEY (`plan_id`) REFERENCES `filtering_plans` (`plan_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- הגבלות לטבלה `client_apps`
--
ALTER TABLE `client_apps`
  ADD CONSTRAINT `client_apps_ibfk_2` FOREIGN KEY (`app_id`) REFERENCES `user_apps` (`app_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `client_apps_ibfk_new` FOREIGN KEY (`client_unique_id`) REFERENCES `clients` (`client_unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- הגבלות לטבלה `custom_plan_selected_apps`
--
ALTER TABLE `custom_plan_selected_apps`
  ADD CONSTRAINT `fk_user_selected_app` FOREIGN KEY (`app_id`) REFERENCES `app_store_apps` (`app_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_selected_client` FOREIGN KEY (`client_unique_id`) REFERENCES `clients` (`client_unique_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- הגבלות לטבלה `magisk_modules`
--
ALTER TABLE `magisk_modules`
  ADD CONSTRAINT `magisk_modules_ibfk_1` FOREIGN KEY (`client_level_id`) REFERENCES `client_levels` (`id`);

--
-- הגבלות לטבלה `remote_commands`
--
ALTER TABLE `remote_commands`
  ADD CONSTRAINT `remote_commands_ibfk_1` FOREIGN KEY (`client_unique_id`) REFERENCES `clients` (`client_unique_id`) ON DELETE CASCADE;

--
-- הגבלות לטבלה `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `fk_tickets_client` FOREIGN KEY (`client_unique_id`) REFERENCES `clients` (`client_unique_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- הגבלות לטבלה `ticket_updates`
--
ALTER TABLE `ticket_updates`
  ADD CONSTRAINT `ticket_updates_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- הגבלות לטבלה `xposed_modules`
--
ALTER TABLE `xposed_modules`
  ADD CONSTRAINT `xposed_modules_ibfk_1` FOREIGN KEY (`client_level_id`) REFERENCES `client_levels` (`id`);

--
-- הגבלות לטבלה `xposed_module_scopes`
--
ALTER TABLE `xposed_module_scopes`
  ADD CONSTRAINT `xposed_module_scopes_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `xposed_modules` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
