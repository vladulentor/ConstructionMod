"use strict";
/** Enemy Class for Golbin Raid */
class Golbin extends Enemy {
    /** Constructs an enemy for golbin raid */
    constructor(manager, game) {
        super(manager, game);
        this.manager = manager;
        this.tempNamespace = {
            name: 'melvorTemp',
            displayName: 'Temporary Namepsace',
            isModded: false,
        };
    }
    get encodeMonster() {
        return false;
    }
    modifyAttackInterval(interval) {
        interval = super.modifyAttackInterval(interval);
        interval /= 2;
        return interval;
    }
    computeMagicMaxHit() {
        return Character.calculateStandardMaxHit(this.levels.Magic, this.equipmentStats.magicDamageBonus);
    }
    modifyMaxHP(maxHP) {
        maxHP *= 1 + this.manager.difficulty.enemyHPModifier / 100;
        return super.modifyMaxHP(maxHP);
    }
    modifyEvasion(evasion) {
        evasion.melee *= 1 + this.manager.difficulty.enemyEvasionModifier / 100;
        evasion.ranged *= 1 + this.manager.difficulty.enemyEvasionModifier / 100;
        evasion.magic *= 1 + this.manager.difficulty.enemyEvasionModifier / 100;
        super.modifyEvasion(evasion);
    }
    modifyMaxHit(maxHit) {
        maxHit *= 1 + this.manager.difficulty.enemyMaxHitModifier / 100;
        return super.modifyMaxHit(maxHit);
    }
    modifyAccuracy(accuracy) {
        accuracy *= 1 + this.manager.difficulty.enemyAccuracyModifier / 100;
        return super.modifyAccuracy(accuracy);
    }
    getMonster(wave, isBoss, hasExtraPassiveChance, game) {
        const golbinData = {
            id: 'RaidGolbin',
            name: Golbin.getName(),
            levels: {
                Hitpoints: Golbin.getLevel(wave, isBoss, true),
                Attack: Golbin.getLevel(wave, isBoss),
                Strength: Golbin.getLevel(wave, isBoss),
                Defence: Golbin.getLevel(wave, isBoss),
                Ranged: Golbin.getLevel(wave, isBoss),
                Magic: Golbin.getLevel(wave, isBoss),
                Corruption: Golbin.getLevel(wave, isBoss),
            },
            equipmentStats: Golbin.getStats(wave, isBoss),
            attackType: Golbin.getAttackType(),
            specialAttacks: [],
            ignoreCompletion: false,
            isBoss: isBoss,
            lootTable: [],
            lootChance: 0,
            media: Golbin.getMedia(isBoss),
            canSlayer: false,
            passives: [],
            selectedSpell: "melvorD:WindStrike" /* AttackSpellIDs.WindStrike */ ,
        };
        let numPassives = 0;
        if (rollPercentage(50))
            numPassives++;
        if (hasExtraPassiveChance && rollPercentage(wave))
            numPassives++;
        if (numPassives > 0) {
            golbinData.passives = [...getExclusiveRandomArrayElements(game.golbinRaid.golbinPassives, numPassives)].map((passive) => passive.id);
        }
        return new GolbinMonster(this.tempNamespace, golbinData, game);
    }
    static getName() {
        const name = getRandomArrayElement(Golbin.names);
        if (setLang === 'en') {
            const trait = getRandomArrayElement(Golbin.traits);
            return `The ${setToUppercase(trait)} ${name}`;
        } else {
            return name;
        }
    }
    computeModifiers() {
        super.computeModifiers();
        this.modifiers.addModifiers(this.manager.randomModifierSource, this.manager.randomEnemyModifiers);
    }
    mergeUninheritedEffectApplicators() {}
    static getLevel(wave, isBoss, hitpoints = false) {
        let minMultiplier = 0.8;
        let maxMultiplier = 1.2;
        let waveMult = 2;
        if (hitpoints) {
            minMultiplier = 0.9 * 0.8;
            maxMultiplier = 1.1 * 0.8;
            waveMult = 1.2;
        }
        if (isBoss)
            waveMult *= 2;
        const setLevel = wave * waveMult + 1;
        let minLevel = Math.floor(setLevel * minMultiplier);
        minLevel = Math.max(minLevel, 1);
        const maxLevel = Math.floor(setLevel * maxMultiplier);
        return rollInteger(minLevel, maxLevel);
    }
    static getAttackType() {
        switch (rollInteger(0, 2)) {
            case 0:
                return 'melee';
            case 1:
                return 'ranged';
            default:
                return 'magic';
        }
    }
    static getMedia(isBoss) {
        if (isBoss) {
            return 'assets/media/monsters/golbin-boss.png';
        } else {
            return `assets/media/monsters/golbin-${rollInteger(0, 20)}.svg`;
        }
    }
    static getStats(wave, isBoss) {
        const bonusValue = Golbin.getStatValue(wave, isBoss);
        const stats = [{
                key: 'attackSpeed',
                value: 3000
            },
            {
                key: 'stabAttackBonus',
                value: bonusValue
            },
            {
                key: 'meleeStrengthBonus',
                value: bonusValue
            },
            {
                key: 'meleeDefenceBonus',
                value: bonusValue
            },
            {
                key: 'rangedAttackBonus',
                value: bonusValue
            },
            {
                key: 'rangedStrengthBonus',
                value: bonusValue
            },
            {
                key: 'rangedDefenceBonus',
                value: bonusValue
            },
            {
                key: 'magicAttackBonus',
                value: bonusValue
            },
            {
                key: 'magicDamageBonus',
                value: bonusValue
            },
        ];
        if (isBoss) {
            stats.push({
                key: 'resistance',
                value: 20,
                damageType: "melvorD:Normal" /* DamageTypeIDs.Normal */ ,
            });
        }
        return stats;
    }
    static getStatValue(wave, isBoss) {
        let value = wave / 4.2;
        if (isBoss)
            value *= 2;
        return Math.floor(value);
    }
    encode(writer) {
        super.encode(writer);
        this.encodeMonsterData(writer);
        return writer;
    }
    /** Encodes the current Golbins monster data */
    encodeMonsterData(writer) {
        writer.writeBoolean(this.monster !== undefined);
        if (this.monster !== undefined) {
            writer.writeString(this.monster.name);
            writer.writeUint32(this.monster.levels.Hitpoints);
            writer.writeUint32(this.monster.levels.Attack);
            writer.writeUint32(this.monster.levels.Strength);
            writer.writeUint32(this.monster.levels.Defence);
            writer.writeUint32(this.monster.levels.Ranged);
            writer.writeUint32(this.monster.levels.Magic);
            writer.writeUint8(AttackTypeID[this.monster.attackType]);
            if (this.monster.isBoss) {
                writer.writeInt8(-1);
            } else {
                const match = this.monster.media.match(/\d+/);
                if (match === null)
                    throw new Error('Could not get media id for golbin');
                writer.writeInt8(parseInt(match[0]));
            }
            writer.writeArray(this.monster.passives, writeNamespaced);
            writer.writeUint32(this.monster.levels.Corruption);
        }
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.decodeMonster(reader, version);
    }
    decodeMonster(reader, version) {
        if (reader.getBoolean()) {
            const monsterData = {
                id: 'RaidGolbin',
                name: reader.getString(),
                levels: {
                    Hitpoints: reader.getUint32(),
                    Attack: reader.getUint32(),
                    Strength: reader.getUint32(),
                    Defence: reader.getUint32(),
                    Ranged: reader.getUint32(),
                    Magic: reader.getUint32(),
                    Corruption: 0,
                },
                equipmentStats: Golbin.getStats(this.manager.wave, this.manager.fightingBoss),
                attackType: AttackTypeID[reader.getUint8()],
                specialAttacks: [],
                ignoreCompletion: false,
                isBoss: this.manager.fightingBoss,
                lootTable: [],
                lootChance: 0,
                media: this.manager.fightingBoss ?
                    'assets/media/monsters/golbin-boss.png' :
                    `assets/media/monsters/golbin-${reader.getInt8()}.svg`,
                canSlayer: false,
                passives: reader.getArray(readNamespacedReject(this.game.combatPassives)).map((passive) => passive.id),
                selectedSpell: "melvorD:WindStrike" /* AttackSpellIDs.WindStrike */ ,
            };
            if (version >= 100 /* SaveVersion.IntoTheAbyss */ )
                monsterData.levels.Corruption = reader.getUint32();
            this.monster = new GolbinMonster(this.tempNamespace, monsterData, this.game);
        }
    }
    deserialize(reader, version, idMap) {
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.monster = this.deserializeMonsterData(reader.getVariableLengthChunk(), version, idMap);
    }
    deserializeMonsterData(reader, version, idMap) {
        const monster = {
            id: 'RaidGolbin',
            name: reader.getString(),
            levels: {
                Hitpoints: reader.getNumber(),
                Attack: reader.getNumber(),
                Strength: reader.getNumber(),
                Defence: reader.getNumber(),
                Ranged: reader.getNumber(),
                Magic: reader.getNumber(),
                Corruption: 0,
            },
            equipmentStats: Golbin.getStats(this.manager.wave, this.manager.fightingBoss),
            attackType: reader.getMonsterAttackType(),
            specialAttacks: [],
            ignoreCompletion: false,
            isBoss: this.manager.fightingBoss,
            lootTable: [],
            lootChance: 0,
            media: this.manager.fightingBoss ?
                'assets/media/monsters/golbin-boss.png' :
                `assets/media/monsters/golbin-${reader.getNumber()}.svg`,
            canSlayer: false,
            passives: [],
            selectedSpell: "melvorD:WindStrike" /* AttackSpellIDs.WindStrike */ ,
        };
        const passiveIDs = reader.getVariableLengthChunk().getRawData();
        if (passiveIDs.length > 0)
            passiveIDs.forEach((oldID) => {
                const newID = idMap.combatPassives[oldID];
                if (this.game.combatPassives.getObjectByID(newID) !== undefined)
                    monster.passives.push(newID);
            });
        return new GolbinMonster(this.tempNamespace, monster, this.game);
    }
}
Golbin.names = [
    'Kurut08',
    'Kroak',
    'Panzer',
    'SudaMoon',
    'duk',
    'aloiiv_wizard',
    'Pritchenko',
    'Vals',
    'nipser',
    'Jay-C',
    'Egyptian Joe',
    'wolflesbian',
    'StripytheDino',
    'kurtmerz',
    'Esp',
    'Krait',
    'Monkey Mob',
    'icing',
    'Detective Steph',
    'Auemex',
    'shazz',
    'MuskyBsack',
    'Zeb',
    'Namikai',
    'Horsey',
    'PleaseEnd',
    'Thource',
    'SoggyMolotov',
    'mike',
    'MichaelinnTires',
    'plaidboy33',
    'Pyral_Sprite195',
    'Ducky',
    'Magnum',
    'Aerotis',
    'ChrisTheKog',
    'Woozy',
    'Eli',
    'Trash Panda',
    'Mishiah',
    'Tanjoubi',
    'panini head',
    'Jarrah',
    'mos',
    'TheGlitchified',
    'SirPrize',
    'Wildride300',
    'Brandino343',
    'Tarkleigh',
    'Ripkinger',
    'ignite',
    'Slacking',
    'Oskimoe',
    'Krameo Lime',
    'HanFox',
    'Bri',
    'Jubilee',
    'Shirra',
    'IGarrettII',
    'Tezxii',
    'Why Play',
    'MineplayerHDYT',
    'lilith',
    'SilverDraghin',
    'Aero',
    'Mufmuf',
    'Bastia',
    'Onno',
    'Dohdee',
    'SuthernDrunk',
    'kaleXwho',
    'Fresky',
    'condge',
    'RavenReaper75',
    'zukakog',
    'malware',
    'LAce',
    'flashburn283',
    'Cloudy',
    'Rushy',
    'nordmu',
    'Gemini',
    'Too Burned',
    'Wingstrocity',
    'Bladesabers',
    'Siberiaan®',
    'Jbelll',
    'FourLaps',
    'Darkhorn',
    '𝕭𝖎𝖙𝖈𝖔𝖎𝖓',
    'dr3af',
    'Answer',
    'Puhp',
    'Fievel',
    'JoblessSF',
    'melwute',
    'Tekila15',
    'DreadBeardSanta',
    'TIMIBITS',
    'Andre Phillipe Phillipe',
    'tnsteeler',
    'Ecstasy',
    'Bubbles',
    'USB_aansluiting',
    'Damwan',
    'goatarooni',
    'Hyperion',
    'Poper925',
    'Fynixknight',
    'barisaxvirus',
    'Gunner1241',
    'Bryff',
    'Ballzak',
    'Aarrez',
    'Falconrith',
    'Synik',
    'jaso07',
    'Fraser',
    'Axius',
    'Lord Puddles Lake',
    'thephatviking',
    'boyoboy101',
    'Kherbellos',
    'Randingo',
    'AUS-10',
    'Jakuh',
    '564',
    'Darden',
    'samosas',
    'mustangcody',
    'TheMuffinMan',
    'Mitch',
    'NoNoNotorious',
    'Pash',
    'PatrickJKellyII',
    'GrAiNGrInDeR',
    'BillGunn',
    'Mista Howard',
    'Jacob11701',
    'Pweast',
    'verrathien',
    'Jonsies',
    'Kori',
    'wally6464',
    'Carnivores64',
    'BigLuk3',
    'iWurfel',
    'Mohmoo',
    'Elivercury',
    'Zugly',
    'HoldenTheAFK',
    'Valandra',
    'Type',
    'Bobby',
    'SleepyFox',
    'Hybrid',
    'Ellamin',
    'Spectrah',
    'WinterStitch',
    'Levent',
    'Fenryk',
    'trev0115',
    'Melty',
    'dantrr',
    'Lucifer',
    'bendaley00',
    'iRegalia',
    'Lightning',
    'Twilkey(Limpious)',
    'Rombah',
    'Zyfel',
    'The kid Rowan',
    'dada',
    'Tievis',
    'Sheviq',
    'Keidos',
    'Horizons',
    'Jaycomma',
    'TwilitWave',
    'Rhys',
    'Quantify',
    'Boyo',
    'Hollow_Sloth',
    'Spiffers',
    'F7 Freaky',
    'Dr.Stein',
    'Arngrin',
    'legendarygamerkillshot',
    'Evu',
    'mercedya',
    'Aurora Aquir',
    'Beyondist',
    'ChickenCat',
    'Rawrence',
    'camm',
    'ThreadBear',
    'Koose830',
    'visual.ze',
    'Rune',
    'JmagLive',
    'NimbleSloth',
    'Voortman',
    'Pyrrhus',
    'im TURB0 bro',
    'Amoa',
    'Maeltorn',
    'Oxidan',
    'Nino',
    'Canichi',
    'GhostPiRunner',
    'RecycleYourself',
    'x4CyLiNdEr',
    'Swindless',
    'Zhongar',
    'Alduwyn',
    'Soviet Ara',
    'Octavio Correia',
    'CapnZach',
    'Fipzz宝治',
    'velhari',
    'indiglow',
    'JoeTheSmiter',
    'poonstomper',
    'Blank1268',
    'lorywindrunner',
    'Dreamtrue',
    'compaincube',
    'Meolae',
    'TomRiddl',
    'Tristo7',
    'Clue',
    'Xtraterrestrial',
    'Veraxxus',
    'Roseweather',
    'Zhenya',
    'Full Primal',
    'grog189',
    'Feistyfists',
    'Lyla',
    'Moebie',
    'Simsopp',
    'Makal',
    'Artinuis',
    'Sudii',
    'Ciers',
    'FLAMING789',
    'Calabriel',
    'Mandulis',
    'Whitepawn',
    'Feraldeus',
    'Petora',
    'Souls',
    'grc',
    'Gushwin',
    'Kontaku',
    'AUS-10',
    'MrMine Goblin',
    'Rowan',
    'Limpious',
    'ChapeauNoir',
    'Sheviq',
    'Yakey',
    'evelgoblin',
    'Alex the Soutas',
    'TwilitWave',
    'Rhys',
    'King Nugget',
    'Quantify',
    'Boyo',
    'Hollow_Sloth',
    'Spiffers',
    'F7 Freaky',
    'Dr.Stein',
    'Arngrin',
    'legendarygamerkillshot',
    'Evu',
    'mercedya',
    'Aurora Aquir',
    'Naptime',
    'Beyondist',
    'ChickenCat',
    'Rawrence',
    'iMike',
    'camm',
    'ThreadBear',
    'Koose830',
    'visual.ze',
    'Rune',
    'JmagLive',
    'NimbleSloth',
    'Voortman',
    'Pyrrhus',
    'im TURB0 bro',
    'Amoa',
    'Maeltorn',
    'Oxi',
    'Nino',
    'Canichi',
    'GhostPiRunner',
    'RecycleYourself',
    'x4CyLiNdEr',
    'Swindless',
    'Zhongar',
    'Alduwyn',
    'BonDiggity',
    'Soviet Ara',
    'Octavio Correia',
    'CapnZach',
    'Fipzza',
    'velhari',
    'Ukiyo',
    'indiglow',
    'JoeTheSmiter',
    'poonstomper',
    'Blank1268',
    'lorywindrunner',
    'Greensun30',
    'Dreamtrue',
    'compaincube',
    'Meolae',
    'TomRiddl',
    'Tristo7',
    'Clue',
    'Xtraterrestrial',
    'Veraxxus',
    'Roseweather',
    'Zhenya',
    'Full Primal',
    'DaddyBiggyFoot',
    'grog189',
    'osiris08',
    'Feistyfists',
    'Lyla',
    'Moebie',
    'Simsopp',
    'Makal',
    'Artinuis',
    'Sudii',
    'Ciers',
    'FLAMING789',
    'Mandulis',
    'Hyperion',
    'Lexifer',
    'Feraldeus',
    'Petora',
    'Souls',
    'grc',
    'BreaderJoe',
    'Kontaku',
    'Feather Stride',
    'sj2347',
    'King Dean',
    'Starnub',
    'laine',
    'Tvcker',
    'Glathnarr',
    'Krispykoala',
    'cecedra',
    'Big Chonkus',
    'YungBobRoss',
    'PotMonsta',
    'damunta',
    'Jeten',
    'CreamOfTheCrop',
    'Dragon',
    'SnowDuts',
    'Shayzx',
    'lJensenl',
    'mazunki',
    'Rival',
    'Dave',
    'TheGoldSkull',
    'Joe Yates',
    'Southall',
    'Maxamovich',
    'Ratshoro',
    'tankpunk',
    'johnhemenway1',
    'AirstrikeRhino2',
    'Uily',
    'K3yblademast',
    'Atmo',
    'Elenoe',
    'Jackie',
    'Star',
    'Smurfing',
    'Aquaholic',
    'aceg_0',
    'Robbo',
    'Yqua',
    'amarks2014',
    'Wave',
    'pocketmouse',
    'Ven',
    'ntx',
    'Jolanger',
    'Desired',
    '-> <3',
    'dundeehitman',
    'Onixpected',
    'CaribouCarp',
    'Kami',
    'Kitune',
    'Forbes',
    'Echo',
    'Krieg',
    'Vinni',
    'spooky',
    'werwolf651',
    'xP-cketsx',
    'UsualSus',
    'Noruas',
    'Kidsmeal',
    'Pony',
    'TTVLunarisLupas',
    'Lindoer',
    'Isaac',
    'Destitute Tehol Beddict',
    'UnicycleMaster',
    'Kgbwolf',
    '0xBrandon',
    'Kaze',
    'socc',
    'LimHuiMin-Tiff',
    'LFP',
    '!S16',
    'Kristo',
    'Argafargadar',
    'Normal Nate',
    'Insertxthere',
    'Lunar Phoenix',
    'AJester',
    'PureIndio',
    'Zhiar',
    'Kyllsyn',
    'Timothy1990',
    'T-jay_HD',
    'Shamolay',
    'Lachrymator7',
    'Niek4000',
    'Penguinton',
    'Hyped',
    'quik',
    'CrackahJak',
    'Abitbol',
    'TheDuke777',
    'Rip and Doot',
    'Riley',
    'MisterKrause',
    'InstaGibb',
    'Princess TransGirl',
    'Ethan.',
    'Clepto',
    'RealSlimShaggy',
    'Allancy',
    'Beef',
    'Acrone',
    'Bedtimebear',
    'LordSimic0714',
    'Conroy',
    'TheGamingStorm',
    'Reyn',
    'Chrillee',
    'Indifference',
    'Grimpickle',
    'Therlorin',
    'Zezuko',
    'Blazeborn',
    'Riri70',
    'lumentec',
    'MangoTango',
    'Feronn',
    'kaitou',
    'Mataholickz',
    'Richie',
    'willstabeast',
    'Dong',
    'Rymo',
    'Lomax',
    'Prettyfig',
    'Nordy',
    'Stevend',
    'CG Nerve',
    'Jhomata',
    'Bar',
    'Nickk',
    'lunchenboxen',
    'Toc',
    'pot',
    'Slenderp',
    'Darry',
    'Ben Yuh',
    'N1ghtM4r 3 (XB1)',
    'linkdbydeath',
    'CashMMT',
    'Aerial',
    'dcrew44',
    'Taynarr',
    'Dogstiny',
    'Alpha Torvar',
    'NickiNoodle',
    'Ender',
    'Benicus',
    'Deadiam',
    'alexheflin',
    'Zero',
    'Viruzzz',
    'TinyCoyote',
    'Austin2420',
    'CodeYo',
    'HealerOfSouls',
    'J M A C K',
    'BigMack',
    'Rum',
    'd3vnull',
    'DrPep',
    'Quarazhi',
    'CrucifiedxLive',
    'Turtle Burger',
    'Nime',
    'µ',
    'Ventigo01',
    'Bobby',
    'Gid-',
    'EmptyOne',
    'Riki',
    'Kolin',
    'Deathstroke',
    'Ashkore',
    'thegreenseda',
    'Lilitsu',
    'Jay V',
    'Nour',
    'Alan',
    'Esmetta',
    'Leedly',
    'The Banana Handler',
    'SPO',
    'Eddie',
    'cwaaah',
    'DanielRX',
    'Miniwheetz',
    'guacalome',
    'ghosts_are_spooky',
    'Ikov548',
    'vamp_v2',
    'Shudds',
    'Dr Dsleksy',
    'Newbie',
    'Enaya Wendos',
    'Keeph',
    'Shiro',
    'Kaptajn Bim',
    'Obsxlete',
    'Shaltiurge',
    'Iron Messy',
    'OmniDestiny',
    'Malchron',
    'Singleton',
    'Dalton',
    'Spriint',
    'Silverfyree',
    'Assyrianlegend',
    '[ ]',
    'Flynx_Master',
    'TooDamnLucky',
    'Disco',
    'PixelCarnage',
    'Rubba_Dub',
    'Greytonic',
    'Sampra',
    'Roman',
    'the literal worst',
    'HHHH CHEF',
    'Rishone',
    'ChioRaver',
    'jahnald',
    '216598762',
    'Auron956',
    'UncleAlcoholic',
    'Tony',
    'DeDabMan',
    'Sima Yi',
    'Berlyn',
    'Nick Proudclaw',
    'JTFizzy',
    'XMALCOLMMLK',
    'Jarose',
    'Frosty',
    'TylerJ',
    'Rezzidue',
    'Moose',
    'Oreios',
    'Kris18',
    'fez',
    'Wicomb',
    'Nogoodskills',
    'GoulHunter',
    'Firazoid',
    'Jarrett',
    'Oogiya',
    'MafiosoPlays',
    'Soromaro',
    'Ethan Obi',
    'Elliott',
    'Mitchell',
    'Prolix',
    'Zorbcck',
    'Not_A_Spider',
    'Ink',
    'Besthpallyworld',
    'Michael7050',
    'Aorpheat',
    'ZH_Steven',
    'Shninckle',
    'Skull N R0ses',
    'wavelength',
    'Namz011',
    'PresidentObrauma',
    'Squirrel',
    'altera',
    'Aldiron',
    'Sudocheese',
    'Casey',
    'Bulborb',
    'Pandemonium',
    'ChrisMx92',
    'deathbyconfetti',
    'Medivh',
    'Arthur',
    'Scrapless',
    'Mateo',
    'Bisping',
    'VenzieAF',
    'Kaylenx',
    'Eliass',
    'rectrec369',
    'luciferos',
];
Golbin.traits = [
    'humble',
    'brave',
    'courageous',
    'serious',
    'resourceful',
    'stubborn',
    'loyal',
    'gullible',
    'selfish',
    'generous',
    'self-confident',
    'respectful',
    'considerate',
    'imaginative',
    'brilliant',
    'creative',
    'independent',
    'carefree',
    'studious',
    'intelligent',
    'honest',
    'mischievous',
    'adventurous',
    'hardworking',
    'daring',
    'charming',
    'lazy',
    'patriotic',
    'successful',
    'responsible',
    'helpful',
    'cautious',
    'polite',
    'conceited',
    'leader',
    'demanding',
    'bossy',
    'gentle',
    'loving',
    'proud',
    'mysterious',
    'eager',
    'hopeful',
    'lucky',
    'cooperative',
    'ambitious',
    'quiet',
    'curious',
    'mature',
    'witty',
    'determined',
    'energetic',
    'calm',
    'mannerly',
    'rude',
    'strict',
    'annoyed',
    'foolish',
    'grumpy',
    'miserable',
    'talented',
    'sly',
    'skillful',
    'rich',
    'thoughtful',
    'tolerant',
    'trustworthy',
    'weak',
    'wise',
    'jealous',
    'lonely',
    'faithful',
    'timid',
    'shy',
];
//# sourceMappingURL=golbin.js.map
checkFileVersion('?12097')