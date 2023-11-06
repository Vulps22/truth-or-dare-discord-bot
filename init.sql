-- phpMyAdmin SQL Dump
-- version 4.9.5deb2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 06, 2023 at 08:32 PM
-- Server version: 10.3.38-MariaDB-0ubuntu0.20.04.1
-- PHP Version: 8.2.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tord`
--
CREATE DATABASE IF NOT EXISTS `tord` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `tord`;

-- --------------------------------------------------------

--
-- Table structure for table `dares`
--

CREATE TABLE `dares` (
  `id` int(18) NOT NULL,
  `question` text NOT NULL,
  `creator` bigint(18) NOT NULL,
  `isBanned` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dares`
--

INSERT INTO `dares` (`id`, `question`, `creator`, `isBanned`) VALUES
(1, 'Jack Off in a NSFW voice channel (camera on!)', 914368203482890240, 0),
(9, 'Jack Off in a NSFW voice channel (camera on!)', 914368203482890240, 0),
(10, 'for the next 30 minutes, call someone by a parental term (mommy / daddy)', 461232602188349470, 0),
(11, 'cum on your own face (mouth open or closed)', 914368203482890240, 0),
(12, 'finger your bum', 914368203482890240, 0),
(13, 'suck yourself off', 350447006759780353, 0),
(14, 'Twerk!', 914368203482890240, 0),
(15, 'Twerk! with your underwear off!', 914368203482890240, 0),
(16, 'take your top off for at least 30 minutes', 914368203482890240, 0),
(17, 'Take your trousers off', 914368203482890240, 0),
(18, 'take your underwear off', 914368203482890240, 0),
(19, 'Strip! 😈', 914368203482890240, 0),
(20, 'take off a piece of clothing', 914368203482890240, 0),
(21, 'flash dick', 914368203482890240, 0),
(22, 'makeout with a pillow for 10 seconds', 914368203482890240, 0),
(23, 'do a sexy dance', 914368203482890240, 0),
(24, 'Try to take off your underwear/bra without flashing.', 914368203482890240, 0),
(25, 'Fake an orgasm', 914368203482890240, 0),
(26, 'Crawl on the ground seductively.', 914368203482890240, 0),
(27, 'spank yourself on cam', 914368203482890240, 0),
(28, 'take off underwear', 914368203482890240, 0),
(29, 'Fit as many fingers as possible into your mouth', 914368203482890240, 0),
(30, 'In VC, Show One Kinky Thing You Have (Sex Toys, Clothing, BDSM Related Things, Etc.) Otherwise Spank Yourself A Few Times Hard', 338434164174880768, 0),
(31, 'sit like a dog with your paws up and your tongue out for 30 seconds', 914368203482890240, 0),
(32, 'Write another player\'s name or a degrading term on your body', 373832284375089163, 0),
(33, 'Shave the hairiest part of your body in VC for anyone to watch 🙈', 914368203482890240, 0),
(34, 'Change your outfit, wear something sexy or revealing', 373832284375089163, 0),
(35, 'If You Have A Dildo, Show Yourself Being Fucked By It In VC With Everyone Watching For 5 Minutes', 338434164174880768, 0),
(36, 'If You Have A Vibrator Or Buttplug, Use One Of Them For The Rest Of The Game. If You Have Both The People In The Group Will Decide What You Use', 338434164174880768, 0),
(37, 'If You Have A Fleshlight/Silicone Pussy, Use It In VC For Everyone To Watch For 5 Minutes', 338434164174880768, 0),
(38, 'Go to the kitchen and make the sexiest snack you can think of, Master Chef style. The catch? You only have three minutes, and you’re the plate.', 898532286759329833, 0),
(39, 'Show the last porn video you watched.', 898532286759329833, 0),
(40, 'Take a selfie of your most outrageous \"O\" face. Now put that as your lock screen, and keep it that way for the next 48 hours.', 898532286759329833, 0),
(41, 'Demonstrate your best oral sex move on the nearest appropriate object.', 898532286759329833, 0),
(42, 'Take a pic OR video of yourself in the bath or the shower', 373832284375089163, 0),
(43, 'show a picture OR video of what you would like to be doing or having done to you right now', 898532286759329833, 0),
(44, 'do your next 5 dares **without any filters**', 914368203482890240, 0),
(45, 'Masturbate and when you\'re close, ask another player for permission or to give you a countdown before you can finish', 373832284375089163, 0),
(46, 'Give yourself a facial and post it, or show the group how much you can deep throat', 373832284375089163, 0),
(47, 'Cum on/in your hand and lick it', 373832284375089163, 0),
(48, 'Join a VC, make someone join you and randomly start moaning.', 1038775824125538445, 0),
(49, 'flash Vagina', 914368203482890240, 0),
(50, 'flash ass', 914368203482890240, 0),
(51, 'make a video begging to be fucked', 914368203482890240, 0),
(52, 'Text the last person you texted saying \"So horny! come fuck me\" - Wait for their response, and then say \"Shit! wrong person!!\". Screenshot the conversation and post it here :P', 914368203482890240, 0),
(53, 'Take a full body selfie showing what you\'re wearing today and post it. \\n\" +\r\n      \'\\n\' +\r\n      \'List each item of clothing so other players can vote on what gets removed\\n\' +\r\n      \'\\n\' +\r\n      \'After 10 mins the item with the most votes has to come off\\n\' +\r\n      \'\\n\' +\r\n      \'Take a video taking it off or a new pic without it on', 373832284375089163, 0),
(55, 'twerk', 941401829034582046, 0);

-- --------------------------------------------------------

--
-- Table structure for table `guilds`
--

CREATE TABLE `guilds` (
  `id` bigint(18) NOT NULL,
  `name` text NOT NULL,
  `hasAccepted` tinyint(1) NOT NULL DEFAULT 0,
  `isBanned` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guilds`
--

INSERT INTO `guilds` (`id`, `name`, `hasAccepted`, `isBanned`) VALUES
(333949691962195969, 'Top.gg Verification Center', 1, 0),
(375709817001476107, 'Fantastic Individuals', 0, 0),
(634112151925293076, 'my thoughts and prayers', 1, 0),
(661602645919793152, 'Best gamers', 1, 0),
(717583330580627474, 'Servidor dos Melhores Amigos', 1, 0),
(734528880366452758, 'That’s No Moon!', 1, 0),
(760599539387990048, 'Birthdays', 1, 0),
(788515326610243615, 'nina is the most prettiest girl ever', 1, 0),
(827540235683889223, 'Polaris', 1, 0),
(840428147199180811, 'TarkovChads server', 1, 0),
(842058090656170034, 'Tchaicho Tchat', 1, 0),
(935299295865880576, 'Server', 1, 0),
(949584204528766986, 'swiftiethestan ;-;', 1, 0),
(956417245909753899, 'Woodsboro Massacre', 1, 0),
(974084832638435378, '✨The Lair✨', 1, 0),
(974720146243457144, 'Server van Nigel', 1, 0),
(977638450578751598, 'Server di GS28', 1, 0),
(987762018205466698, 'Userphone Friends <3', 1, 0),
(1015984081844043877, 'Nashedi Log', 1, 0),
(1026627417781043220, 'Le DM server', 1, 0),
(1032620173712179230, '5D - najlepsza klasa w szkole', 1, 0),
(1050773363209027624, 'TOWNSHIP  COMMUNITY DISCORD SERVER', 1, 0),
(1075475265725141053, 'Happy family ✨✨', 1, 0),
(1079206786021732412, 'Truth or Dare Online 18+ Official Server', 1, 0),
(1079241659981774929, 'Bot Development Server Manager', 0, 0),
(1082126994214486097, 'UK Meetups 18+', 1, 0),
(1082651375248359525, '/o/', 1, 0),
(1084486859310247957, '♧ Loving Game Roblox ♧ [ LGR ]', 1, 0),
(1086627361828634756, 'Animaters/Artists/Youtuber club', 1, 0),
(1096388077481627679, 'Muerte#VERKLİG', 0, 0),
(1098284400673824870, 'The Friend Hangout Group!', 1, 0),
(1099370120289202386, 'nsfw paradise', 1, 0),
(1100985136113266690, 'Fight the P', 1, 0),
(1101189162499055690, 'Hooky Development Server', 0, 0),
(1109241081629003927, 'Gayming', 1, 0),
(1112960076827869248, 'Nae’s server', 1, 0),
(1116460110819115080, 'yep', 1, 0),
(1119097106108534927, 'you all are losers, twinks!!', 1, 0),
(1124634309224042496, 'bot server', 1, 0),
(1126457427081039882, 'Suicidal Server (in therapy)', 1, 0),
(1126829542808506398, 'The Hide Out', 1, 0),
(1131524499314065481, 'My basement', 1, 0),
(1132136157359112272, 'Fox’s archive', 1, 0),
(1141187377541427291, 'Boop the Proot fruit  (rp)', 1, 0),
(1142915091948380190, 'Fuck this shit', 1, 0),
(1144085269264482314, 'Gin Whiskey Fox', 1, 0),
(1144485605795975231, 'Don\'t Panic', 1, 0),
(1146206709648461904, 'Servidor de PetterZ7', 0, 0),
(1146460806473580615, ':/', 1, 0),
(1150787446536163438, 'gaming server:', 1, 0),
(1152186901088960542, 'My Kingdom!', 1, 0),
(1153431035372118066, 'andy&marianne fun room', 1, 0),
(1156437242408087596, 'Fear The Living', 1, 0),
(1156690445842272358, 'TOSSERS PLEASE', 1, 0),
(1158770451116470373, 'plooooooom adv', 1, 0),
(1158783807068053576, 'ɴꜱꜰᴡ', 1, 0),
(1158907177969389598, 'Server van RoyalCookies', 1, 0),
(1159263802244726784, 'E2', 1, 0),
(1161373971556614184, 'Idk what to name this', 1, 0),
(1161456029347893329, 'Horni', 1, 0),
(1161748955646935042, '~♡~ Midnight Club | 18+ ~♡~', 1, 0),
(1161856742561435678, 'clubinho sozinho', 0, 0),
(1162059315146936433, 'Beanzz’s ultra private server', 1, 0),
(1162562221050691614, 'pa nois', 1, 0),
(1162914397652533322, 'n pergunte oq acontece aqui', 1, 0),
(1164617471148433458, 'bucan is gay', 1, 0),
(1164777094933393418, 'Anti-crocs social club', 1, 0),
(1164980500004347947, 'Pro randoms', 1, 0),
(1165019555471556661, 'sudz', 0, 0),
(1165463146157314118, 'Degenerate Society 21+', 1, 0),
(1165719534708211885, 'secr', 1, 0),
(1166119686820339722, 'Nerds United', 1, 0),
(1166185815009931344, 'DGT - 1 SSEASON - AMERICA CONTINENTAL LEAGUE | Of the TRS', 1, 0),
(1166245465256382496, 'lighthouse', 1, 0),
(1166251579872116767, 'secret laboratory', 1, 0),
(1166568967721205820, 'Bot Testing Server', 1, 0),
(1167222139473104977, 'balls and tits', 1, 0),
(1168138433185726484, 'Ehehe', 1, 0),
(1168302576496816169, 'Mamamama', 1, 0),
(1168509708571775036, 'secret room', 1, 0),
(1168510656136368210, '♥ Couples server UwU ♥', 1, 0),
(1168618023507210272, 'Bhdfsdsccdsagvdsav kullanıcısının sunucusu', 1, 0),
(1168707420399345684, '◥꧁Ƒ₳ᴉⱤẏ Ĉђ₳ɱƀeⱤ꧂◤', 1, 0),
(1168724749011144864, 'WAP Alliance', 1, 0),
(1168980960415600741, 'Truth or dare', 1, 0),
(1169026081165156412, 'Mewo', 1, 0),
(1169272126600122540, 'Server von ghost', 1, 0),
(1169456883778715648, 'make me your slut', 1, 0),
(1169969622003503154, 'Gghhh', 1, 0),
(1170100669219348701, 'Me And My Girlfriend', 1, 0),
(1170279315850666024, ':3', 1, 0),
(1170456692950056980, 'Vulps\'s server', 1, 0),
(1170495561087066193, 'Brooklyn\'s NSFW server', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `type` text NOT NULL,
  `sender` bigint(18) NOT NULL,
  `reason` text NOT NULL,
  `offenderId` bigint(18) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `truths`
--

CREATE TABLE `truths` (
  `id` int(18) NOT NULL,
  `question` text NOT NULL,
  `creator` bigint(18) NOT NULL,
  `isBanned` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `truths`
--

INSERT INTO `truths` (`id`, `question`, `creator`, `isBanned`) VALUES
(3, 'who on this server would you most like to see naked?', 914368203482890240, 0),
(4, 'who on this server would you most like to kiss?', 914368203482890240, 0),
(5, 'who on this server would you most like to suck off?', 914368203482890240, 0),
(6, 'who on this server would you most like to suck off?', 914368203482890240, 0),
(7, 'who on this server would you most like to masturbate with??', 914368203482890240, 0),
(8, 'what was the most embarrasing thing that ever happened to you at school?', 914368203482890240, 0),
(9, 'what were you thinking about the last time you masturbated?', 914368203482890240, 0),
(10, 'when did you last masturbate?', 914368203482890240, 0),
(11, 'What\'s the biggest thing you\'ve ever had \'inside you\' 👀', 914368203482890240, 0),
(12, 'Have you ever catfished anybody? If so, what happened? If not, have you wanted to?', 350447006759780353, 0),
(13, 'If you had to hook up with one family member, who would it be?', 350447006759780353, 0),
(14, 'What is something illegal you’ve done?', 350447006759780353, 0),
(15, 'who on this server would you most like to make out with', 914368203482890240, 0),
(16, 'describe your favourite \"high school\" fantasay, in detail 😉', 914368203482890240, 0),
(17, 'when did you first cum?', 914368203482890240, 0),
(18, 'Swallow or spit?', 914368203482890240, 0),
(19, 'PJs, Underwear, or naked? how do you sleep?', 914368203482890240, 0),
(20, 'What is a kink you have/would try that others would find questionable?', 338434164174880768, 0),
(21, 'Have you masturbated to anyone in the server? If so who', 373832284375089163, 0),
(22, 'Tell the group in some detail about a sexual fantasy you have, if it applies be specific with who', 373832284375089163, 0),
(23, 'Have you ever had sex of any kind with someone you regretted afterwards?', 373832284375089163, 0),
(24, 'Which is your favourite kind of sex: soft, slow, and sweet or aggressive, fast, and feisty?', 898532286759329833, 0),
(25, 'Have you ever faked an orgasm?', 898532286759329833, 0),
(26, 'What your maddest one-night stand story?', 898532286759329833, 0),
(27, 'What\'s your \"body count\" how many people have you had intercourse with', 373832284375089163, 0),
(28, 'How many people have you slept with at the same time?', 373832284375089163, 0),
(29, 'Describe your ideal date in full detail, this includes what happens after the date and during', 871897083370700800, 0),
(30, 'Would you rather suck on deez nuts- or eat me out---', 1038775824125538445, 0),
(31, 'if you are 6 inches inside your mum and your dad is 6 inches inside you, would you move forward or backward to get out.', 231113174768680961, 0),
(32, 'What is a Kink/Fetish you haven\'t done are really curious to try? Describe it and why', 373832284375089163, 0),
(33, 'What is something sexual you\'d be reluctant to do but will give it a try?', 373832284375089163, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dares`
--
ALTER TABLE `dares`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guilds`
--
ALTER TABLE `guilds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `truths`
--
ALTER TABLE `truths`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dares`
--
ALTER TABLE `dares`
  MODIFY `id` int(18) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `truths`
--
ALTER TABLE `truths`
  MODIFY `id` int(18) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
