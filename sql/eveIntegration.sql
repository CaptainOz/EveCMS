--
-- @file eveIntegrations.sql
--
-- This file contains the bridge between EveCMS and Eve Online.
--
-- The tables which connect EveCMS user accounts with Eve Online pilots, corporations, and alliances
-- are stored herein. The IDs of these entities as Eve Online knows them may be missing if they are
-- first encountered in a text kill mail. They will be back-populated as soon as the ID is
-- discovered.
--
-- @author Oz <oz@lifewanted.com>
--

-- Eve accounts table.
--
-- User accounts from Eve Online are stored in this table. They may or may not be associated with an
-- EveCMS user at time of creation.
CREATE TABLE `eveAccounts` (
    `eveAccountId`  INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `accountId`     INTEGER UNSIGNED    NOT NULL,
    `userId`        INTEGER UNSIGNED        NULL,
    PRIMARY KEY `pk_eveAccounts` ( `eveAccountId` ),
    FOREIGN KEY `eveAccoutns_userId` ( `userId` )
        REFERENCES `users` ( `userId` )
        ON DELETE CASCADE,
    UNIQUE KEY `eveAccounts_accountId` ( `accountId` )
) ENGINE = InnoDB;

-- Eve API keys.
--
-- All user API keys are kept here. Whether the API key is full or not should be detected before
-- inserting it to the table and the Eve account to which it is associated must be created first.
-- When keys become invalid they are not removed, but simply marked as invalid.
CREATE TABLE `eveAPIKeys` (
    `eveAPIKeyId`   INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `eveAccountId`  INTEGER UNSIGNED    NOT NULL,
    `apiKey`        CHAR( 64 )          NOT NULL,
    `isFull`        BOOLEAN             NOT NULL,
    `isValid`       BOOLEAN             NOT NULL,
    PRIMARY KEY `pk_eveAPIKeys` ( `eveAPIKeyId` ),
    FOREIGN KEY `eveAPIKeys_eveAccountId` ( `eveAccountId` )
        REFERENCES `eveAccounts` ( `eveAccountId` )
        ON DELETE CASCADE,
    UNIQUE KEY `eveAPIKeys_apiKey` ( `apiKey` )
) ENGINE = InnoDB;


-- Eve alliances table.
CREATE TABLE `eveAlliances` (
    `eveAllianceId`     INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `allianceId`        INTEGER UNSIGNED        NULL,
    `allianceName`      VARCHAR( 255 )      NOT NULL,
    PRIMARY KEY `pk_eveAlliances` ( `eveAllianceId` ),
    UNIQUE KEY `eveAlliances_allianceId`    ( `allianceId`      ),
    UNIQUE KEY `eveAlliances_allianceName`  ( `allianceName`    )
) ENGINE = InnoDB;

-- Eve corporations table.
CREATE TABLE `eveCorporations` (
    `eveCorporationId`  INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `corporationId`     INTEGER UNSIGNED        NULL,
    `corporationName`   VARCHAR( 255 )      NOT NULL,
    `eveAllianceId`     INTEGER UNSIGNED        NULL,
    PRIMARY KEY `pk_eveCorporations` ( `eveCorporationId` ),
    FOREIGN KEY `eveCorporations_eveAllianceId` ( `eveAllianceId` )
        REFERENCES `eveAlliances` ( `eveAllianceId` )
        ON DELETE CASCADE,
    UNIQUE KEY `eveCorporations_corporationId`      ( `corporationId`   ),
    UNIQUE KEY `eveCorporations_corporationName`    ( `corporationName` )
) ENGINE = InnoDB;

-- Eve corporation alliance membership history.
--
-- The history of Eve corporations' alliance memberships are recorded here. Since the join and leave
-- dates for a corporation in an alliance is not easily available much of this data will need to be
-- inferred from other sources.
--
-- It is not recommended that tools rely on this table to figure out what alliance a corporation is
-- in at a given date and should instead store the alliance ID as well as the corporation ID if they
-- have the information available.
CREATE TABLE `eveCorporationAllianceHistory` (
    `eveCorporationId`  INTEGER UNSIGNED    NOT NULL,
    `eveAllianceId`     INTEGER UNSIGNED    NOT NULL,
    `joinDate`          DATETIME                NULL,
    `leaveDate`         DATETIME                NULL,
    FOREIGN KEY `eveCorporationAllianceHistory_eveCorporationId` ( `eveCorporationId` )
        REFERENCES `eveCorporations` ( `eveCorporationId` )
        ON DELETE CASCADE,
    FOREIGN KEY `eveCorporationAllianceHistory_eveAllianceId` ( `eveAllianceId` )
        REFERENCES `eveAlliances` ( `eveAllianceId` )
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- Eve pilots table.
CREATE TABLE `evePilots` (
    `evePilotId`        INTEGER UNSIGNED    NOT NULL AUTOINCREMENT,
    `pilotId`           INTEGER UNSIGNED        NULL,
    `pilotName`         VARCHAR( 255 )      NOT NULL,
    `eveAccountId`      INTEGER UNSIGNED        NULL,
    `eveRaceId`         INTEGER UNSIGNED        NULL,
    `eveCorporationId`  INTEGER UNSIGNED        NULL,
    PRIMARY KEY `pl_evePilots` ( `evePilotId` ),
    FOREIGN KEY `evePilots_eveAccountId` ( `eveAccountId` )
        REFERENCES `eveAccounts` ( `eveAccountId` )
        ON DELETE CASCADE,
    UNIQUE KEY `evePilots_pilotId`      ( `pilotId`     ),
    UNIQUE KEY `evePilots_pilotName`    ( `pilotName`   )
) ENGINE = InnoDB;

-- Eve pilot corpration membership history.
--
-- This table is just like the eveCorporationAllianceHistory table but records the history of pilots
-- and their corporation memberships instead. It has all the same caveats and limitations.
CREATE TABLE `evePilotCorporationHistory` (
    `evePilotId`        INTEGER UNSIGNED    NOT NULL,
    `eveCorporationId`  INTEGER UNSIGNED    NOT NULL,
    `joinDate`          DATETIME                NULL,
    `leaveDate`         DATETIME                NULL,
    FOREIGN KEY `evePilotCorporationHistory_evePilotId` ( `evePilotId` )
        REFERENCES `evePilots` ( `evePilotId` )
        ON DELETE CASCADE,
    FOREIGN KEY `evePilotCorporationHistory_eveCorporationId` ( `eveCorporationId` )
        REFERENCES `eveCorporations` ( `eveCorporationId` )
        ON DELETE CASCADE
) ENGINE = InnoDB;
