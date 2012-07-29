--
-- @file core.sql
--
-- This file contains all the core database tables used by EveCMS.
--
-- These are the absolute minimum tables required for EveCMS to run. It does not include any of the
-- Eve Online integrations nor tools that make EveCMS great, but it does provide the framework on
-- which all of that is built.
--
-- @author Oz <oz@lifewanted.com>
--
-- @todo Add database creation.
--

-- User accounts table.
--
-- This table contains all the EveCMS user accounts.
CREATE TABLE `users` (
    `userId`    INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `lastLogin` DATETIME                NULL,
    PRIMARY KEY `pk_users` ( `userId` )
) ENGINE = InnoDB;

-- User account login table.
--
-- This table contains all the logins for EveCMS user accounts. Any given user may have more than
-- one login, such as their primary login and an account sitter login.
CREATE TABLE `userLogins` (
    `userLoginId`   INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `userId`        INTEGER UNSIGNED    NOT NULL,
    `username`      VARCHAR( 255 )      NOT NULL,
    `password`      CHAR( 64 )          NOT NULL,
    PRIMARY KEY `pk_userLogins` ( `userLoginId` ),
    FOREIGN KEY `userLogins_userId` ( `userId` )
        REFERENCES `users` ( `userId` )
        ON DELETE CASCADE,
    UNIQUE KEY `userLogins_username` ( `username` )
) ENGINE = InnoDB;

-- Core tool table.
--
-- This table contains all the tools that are currently installed in the given EveCMS server. All
-- tools will be registered in this table upon installation.
CREATE TABLE `tools` (
    `toolId`        INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `toolName`      VARCHAR( 255 )      NOT NULL,
    `shortName`     VARCHAR( 25 )       NOT NULL,
    `description`   VARCHAR( 1023)      NOT NULL,
    `installed`     BOOLEAN             NOT NULL,
    `active`        BOOLEAN             NOT NULL,
    PRIMARY KEY `pk_tools` ( `toolId` ),
    UNIQUE KEY `tools_shortName` ( `shortName` )
) ENGINE = InnoDB;

-- Collection of all loggable user activity types.
--
-- Any activity a user performs that a tool wants to record must be added to this table during tool
-- installation.
CREATE TABLE `userActivityTypes` (
    `userActivityTypeId`    INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `toolId`                INTEGER UNSIGNED    NOT NULL,
    `userActivityName`      VARCHAR( 255 )      NOT NULL,
    `description`           VARCHAR( 1023 )     NOT NULL,
    PRIMARY KEY `pk_userActivityTypes` ( `userActivityTypeId` ),
    FOREIGN KEY `userActivityTypes_toolId` ( `toolId` )
        REFERENCES `tools` ( `toolId` )
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- The actual log of user activity.
--
-- All user activity is kept in this table. It should be periodically cleansed by EveCMS to prevent
-- it from growing too large. This table only contains the date, type, and login of the action. To
-- record more specific data about the activity the tool should create its own history table and
-- link it to the userActivityLog table.
CREATE TABLE `userActivityLog` (
    `userActivityLogId`     INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `userLoginId`           INTEGER UNSIGNED    NOT NULL,
    `activityDate`          DATETIME            NOT NULL,
    `userActivityTypeId`    INTEGER UNSIGNED    NOT NULL,
    PRIMARY KEY `pk_userActivityLog` ( `userActivityLogId` ),
    FOREIGN KEY `userActivityLog_userLoginId` ( `userLoginId` )
        REFERENCES `userLogins` ( `userLoginId` )
        ON DELETE CASCADE,
    FOREIGN KEY `userActivityLog_activityTypeId` ( `userActivityTypeId` )
        REFERENCES `userActivityTypes` ( `userActivityTypeId` )
        ON DELETE CASCADE,
    INDEX `userActivityLog_activityDate` DESC USING BTREE ( `activityDate` )
) ENGINE = InnoDB;

-- User login history.
--
-- History of all user login attempts, successful or otherwise. This table can be used to audit user
-- logins.
CREATE TABLE `userLoginHistory` (
    `userActivityLogId` INTEGER UNSIGNED    NOT NULL,
    `ipAddress`         VARCHAR( 15 )       NOT NULL,
    `successful`        BOOLEAN             NOT NULL,
    FOREIGN KEY `userLoginHistory_userActivityLogId` ( `userActivityLogId` )
        REFERENCES `userActivityLog` ( `userActivityLogId` )
        ON DELETE CASCADE
) ENGINE  = InnoDB;
