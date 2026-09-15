-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: werkorder_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `fotos`
--

DROP TABLE IF EXISTS `fotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fotos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `werkorder_id` int NOT NULL,
  `beschrijving` text,
  `bestandspad` varchar(500) NOT NULL,
  `genomen_op` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_fotos_werkorder` (`werkorder_id`),
  CONSTRAINT `fk_fotos_werkorder` FOREIGN KEY (`werkorder_id`) REFERENCES `werkorders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materialen`
--

DROP TABLE IF EXISTS `materialen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materialen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `werkorder_id` int NOT NULL,
  `tip` enum('klant','bedrijf','verkoop') NOT NULL,
  `naam` varchar(255) NOT NULL,
  `aantal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `eenheid` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_materialen_werkorder` (`werkorder_id`),
  CONSTRAINT `fk_materialen_werkorder` FOREIGN KEY (`werkorder_id`) REFERENCES `werkorders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('owner','admin','medewerker') NOT NULL DEFAULT 'medewerker',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `token_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `werkorder_access`
--

DROP TABLE IF EXISTS `werkorder_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `werkorder_access` (
  `id` int NOT NULL AUTO_INCREMENT,
  `werkorder_id` int NOT NULL,
  `user_id` int NOT NULL,
  `granted_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_werkorder_access` (`werkorder_id`,`user_id`),
  KEY `fk_werkorder_access_user` (`user_id`),
  KEY `fk_werkorder_access_granted_by` (`granted_by`),
  CONSTRAINT `fk_werkorder_access_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_werkorder_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_werkorder_access_werkorder` FOREIGN KEY (`werkorder_id`) REFERENCES `werkorders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `werkorder_assignment_history`
--

DROP TABLE IF EXISTS `werkorder_assignment_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `werkorder_assignment_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `werkorder_id` int NOT NULL,
  `from_user_id` int DEFAULT NULL,
  `from_user_email` varchar(255) DEFAULT NULL,
  `to_user_id` int DEFAULT NULL,
  `to_user_email` varchar(255) NOT NULL,
  `changed_by` int DEFAULT NULL,
  `changed_by_email` varchar(255) DEFAULT NULL,
  `reason` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_assignment_history_werkorder` (`werkorder_id`),
  KEY `fk_assignment_history_from_user` (`from_user_id`),
  KEY `fk_assignment_history_changed_by` (`changed_by`),
  KEY `fk_assignment_history_to_user` (`to_user_id`),
  CONSTRAINT `fk_assignment_history_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignment_history_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignment_history_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignment_history_werkorder` FOREIGN KEY (`werkorder_id`) REFERENCES `werkorders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `werkorders`
--

DROP TABLE IF EXISTS `werkorders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `werkorders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `werkorder_id` varchar(100) NOT NULL,
  `aankomsttijd` time DEFAULT NULL,
  `eindtijd` time DEFAULT NULL,
  `datum` date NOT NULL,
  `uitgevoerde_werkzaamheden` text,
  `status` enum('Voltooid','Niet Voltooid','In Afwachting') DEFAULT NULL,
  `is_voltooid` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_werkorders_created_by` (`created_by`),
  KEY `fk_werkorders_assigned_user` (`assigned_to`),
  CONSTRAINT `fk_werkorders_assigned_user` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_werkorders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-15 15:24:15
