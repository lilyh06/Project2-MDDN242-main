// ============================================================
//  YOUR CREATURE  —  sketch.js   (spider edition)
//  MDDN242 Project 2
// ============================================================

new p5(function(p) {

    // ============================================================
    //  SETTINGS
    // ============================================================

    const SHOW_UI       = true;
    const USE_WEB_IMAGE = false;

    let CREATURE_SIZE   = 110;
    let DECAY_RATE      = 0.003;
    let AWAY_RATE       = 0.020;
    let AFK_PER_HOUR    = 5;
    let AFK_MAX_HOURS   = 168;
    let CLICK_FEED      = 20;
    let MIC_THRESHOLD   = 0.35;
    let EXCITED_FRAMES  = 40;
    let BOUNCE_SCALE    = 1.0;

    let bgImg, bgBehind;
    let focusLostAt      = null;
    let focusAwayMinutes = 0;
    let raindrops        = [];
    let rainActive       = false;

    // WEB + DEBRIS
    let debris           = [];
    let selectedDebris   = null;
    let webLayer;
    let web2Img, web3Img, web4Img, web5Img;
    let webFade          = 0;
    let webFading        = false;
    let currentWeb       = 1;
    let targetWeb        = null;
    let dropletsLayer;
    let debrisImg1, debrisImg2;
    let debris1Count     = 0;
    let debris2Count     = 0;
    let recentDebrisFalls = [];
    let nextDebrisSpawn  = 0;

    // ENVELOPE
    let envelopeImg;
    let bouquetImg;
    let bouquetAvailable = false;
    let bouquet          = null;
    let fadeStartTime    = null;
    let envelopeBounds   = { x: 0, y: 0, w: 0, h: 0 };
    let envelopeBounce   = 0;

    let rainStartTime    = null;
    let dropletAlpha     = 0;
    let windSway         = 0;
    let windActive       = false;
    let spiderBracing    = false;
    let fadeDuration     = 10000;
    let calmVisitTime    = 0;
    let connectionLevel  = 0;
    let loudEvents       = [];
    let frustrationTimer = 0;
    let stars            = [];
    let relationshipLevel = 0;
    let fearLevel        = 0;
    let seenWebs         = new Set([1]);

    // CLEAR SKY web-change system
    let clearSkyStart    = null;   // when current clear sky streak began
    let nextClearWebChange = 0;    // timestamp for next spontaneous web change

    // RAIN WORRY system
    let rainWorryTimer   = 0;      // frames of rain-induced worry

    // SMILEY FACE debris arrangement
    let smileyActive     = false;
    let smileyDebris     = [];     // debris objects placed in smiley pattern
    let smileyShown      = false;  // only show once per session

    // DRAGONFLY
    let dragonflyImg     = null;
    let nextDragonflySpawn = 0;   // timestamp after which dragonfly re-enters
    let dragonfly = {
        x: -9999, y: 0,          // start off-screen hidden until relationship >= 15
        speed: 1.0,               // slower than before
        wiggle: 0,
        size: 70,
        alive: true,
        stuck: false,
        stuckNode: null,
        dragging: false,
        offsetX: 0, offsetY: 0,
        eatTimer: 0,
        eaten: false,
        naturalCatchCooldown: 0,
        active: false,            // only true when relationship >= 15
    };
    let selectedDragonfly = false;

    // LADYBUG — faster, harder to catch
    let ladybugImg       = null;
    let nextLadybugSpawn = 0;
    let ladybug = {
        x: -9999, y: 0,
        speed: 2.8,               // faster than dragonfly
        wiggle: 0,
        size: 45,                 // smaller, harder to grab
        stuck: false,
        stuckNode: null,
        dragging: false,
        offsetX: 0, offsetY: 0,
        eaten: false,
        naturalCatchCooldown: 0,
        active: false,
    };
    let selectedLadybug  = false;

    // SPIDER BODY SHELL overlay image
    let spiderShellImg   = null;

    // Eating lock — spider freezes while consuming a bug
    let eatingLock       = false;

    // LOUD TRACKING (continuous + burst)
    let loudStartTime    = null;   // when continuous loud streak began
    let loudBurstEvents  = [];     // timestamps of loud bursts (for 5-in-1-min check)
    let lastLoudPenalty  = 0;      // debounce so penalty fires once per event

    // FIX: declared at top level so p.setup and p.draw can both access it
    let cloudImg        = null;
    let cloudX           = 0;
    let cloudY           = 0;
    let cloudSpeed       = 0.3;
    let cloudAlpha       = 0;
    let cloudsActive     = false;

    let BASE_SPEED       = 0.006;
    let travelSpeed      = BASE_SPEED;

    const BODY_COL = [255, 126, 0];
    const BLACK    = [0, 0, 0];
    const WHITE    = [255, 255, 255];


    // ============================================================
    //  WEATHER + TIME SYSTEM (Wellington, NZ)
    // ============================================================

    let weatherData      = null;
    let lastWeatherFetch = 0;

    const COL_SUNNY_DAY  = [150, 200, 255];
    const COL_CLOUDY_DAY = [200, 200, 210];
    const COL_CLOUDY_LATE= [140, 140, 150];
    const COL_SUNSET     = [255, 150, 80];
    const COL_NIGHT      = [10,  20,  40];

    async function fetchWeather() {
        if (Date.now() - lastWeatherFetch < 10 * 60 * 1000) return;
        lastWeatherFetch = Date.now();
        const url = "https://api.open-meteo.com/v1/forecast?latitude=-41.2865&longitude=174.7762&current=temperature_2m,weather_code&timezone=Pacific/Auckland";
        try {
            const res  = await fetch(url);
            weatherData = await res.json();
        } catch (e) {
            console.log("Weather fetch failed:", e);
        }
    }

    function getBackgroundColor() {
        if (!weatherData) return COL_SUNNY_DAY;
        const hour = new Date().getHours() + new Date().getMinutes() / 60;
        let from, to, t;

        if (hour < 6) {
            // Dead of night
            return COL_NIGHT.slice();
        } else if (hour < 7) {
            // Pre-dawn: night → sunrise orange
            from = COL_NIGHT; to = COL_SUNSET; t = hour - 6;
        } else if (hour < 8.5) {
            // Sunrise: orange → day blue
            from = COL_SUNSET; to = COL_SUNNY_DAY; t = (hour - 7) / 1.5;
        } else if (hour < 17) {
            // Daytime
            return COL_SUNNY_DAY.slice();
        } else if (hour < 18.5) {
            // Afternoon → golden sunset
            from = COL_SUNNY_DAY; to = COL_SUNSET; t = (hour - 17) / 1.5;
        } else if (hour < 20) {
            // Sunset → night (quick fade after 6:30pm)
            from = COL_SUNSET; to = COL_NIGHT; t = (hour - 18.5) / 1.5;
        } else {
            // Full night
            return COL_NIGHT.slice();
        }

        t = Math.max(0, Math.min(1, t));
        return [
            p.lerp(from[0], to[0], t),
            p.lerp(from[1], to[1], t),
            p.lerp(from[2], to[2], t),
        ];
    }

    function describeWeather(code) {
        const map = {
            0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Foggy", 48: "Foggy",
            51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
            61: "Light rain", 63: "Rain", 65: "Heavy rain",
            80: "Light showers", 81: "Showers", 82: "Heavy showers",
        };
        return map[code] || "Unknown";
    }


    // ============================================================
    //  WEB GRAPH
    // ============================================================

    const WEB_NODES = [
        { id:  0, x: 0.78, y: 0.04 },
        { id:  1, x: 0.52, y: 0.18 },
        { id:  2, x: 0.72, y: 0.28 },
        { id:  3, x: 0.88, y: 0.22 },
        { id:  4, x: 0.30, y: 0.32 },
        { id:  5, x: 0.48, y: 0.42 },
        { id:  6, x: 0.65, y: 0.50 },
        { id:  7, x: 0.80, y: 0.55 },
        { id:  8, x: 0.92, y: 0.40 },
        { id:  9, x: 0.96, y: 0.60 },
        { id: 10, x: 0.18, y: 0.60 },
        { id: 11, x: 0.42, y: 0.72 },
        { id: 12, x: 0.68, y: 0.78 },
        { id: 13, x: 0.88, y: 0.82 },
    ];

    const WEB_EDGES = [
        [0,1],[0,2],[0,3],
        [1,2],[2,3],
        [1,4],[1,5],[2,5],[2,6],[3,6],[3,7],[3,8],[8,9],
        [4,5],[5,6],[6,7],[7,8],
        [4,10],[5,11],[6,11],[6,12],[7,12],[7,13],[9,13],
        [10,11],[11,12],[12,13],
    ];


    // ============================================================
    //  STATE MACHINE
    // ============================================================

    const STATES = {
        happy:      { bounceAmt: 0.04,  shakeAmt: 0.0, alphaTarget: 255 },
        neutral:    { bounceAmt: 0.02,  shakeAmt: 0.0, alphaTarget: 255 },
        distressed: { bounceAmt: 0.01,  shakeAmt: 0.5, alphaTarget: 255 },
        excited:    { bounceAmt: 0.10,  shakeAmt: 0.0, alphaTarget: 255 },
        calm:       { bounceAmt: 0.015, shakeAmt: 0.0, alphaTarget: 255 },
        untrusted:  { bounceAmt: 0.015, shakeAmt: 0.3, alphaTarget: 255 },
        worried:    { bounceAmt: 0.06,  shakeAmt: 0.5, alphaTarget: 255 },
        frustrated: { bounceAmt: 0.07,  shakeAmt: 0.5, alphaTarget: 255 },
        comfort:    { bounceAmt: 0.01,  shakeAmt: 0.0, alphaTarget: 255 },
        fear:       { bounceAmt: 0.00,  shakeAmt: 1.0, alphaTarget: 255 },
        nap:        { bounceAmt: 0.005, shakeAmt: 0.0, alphaTarget: 255 },
    };

    const STATE_DESCRIPTIONS = {
        happy:      'need is low — roaming freely',
        neutral:    'need is rising — avoiding backtrack',
        distressed: 'need is high — retreating to hub',
        excited:    'you brought food! — chasing mouse',
        calm:       'quiet company — slowing down, relaxed',
        worried:    "you're gone — moving quickly, uneasy",
        untrusted:  "hasn't seen you in a while — cautious, slow to relax",
        frustrated: 'too loud — irritated, waiting',
        comfort:    "quiet company — bonding, relaxed",
        fear:       "overwhelmed — curled up, scared",
        nap:        "fast asleep — legs tucked, dreaming",
    };

    function getState(c) {
        // Fear from debris/loud overrides everything
        if (fearLevel > 0.7)                             return "fear";
        if (fearLevel > 0.4 && c.state !== "frustrated") return "distressed";

        // Nap: nighttime (11pm–5am), trusted, relationship > 10, tab focused
        let hr = new Date().getHours();
        let isNight = hr >= 23 || hr < 5;
        if (isNight && c.trustLevel >= 1 && relationshipLevel > 10 && fearLevel < 0.2 && c.isWatched && !eatingLock) {
            return "nap";
        }

        // High relationship (>=90pts) gives the spider a 10-minute grace window
        if (!c.isWatched) {
            let worryThreshold = relationshipLevel >= 90 ? 10 : 0;
            if (focusAwayMinutes >= worryThreshold) return "worried";
        }

        // Rain worry: prolonged rain (10+ min) makes spider uneasy about its web
        if (rainWorryTimer > 60 && fearLevel < 0.4) return "worried";

        // Loud mic — but if fearLevel is also elevated, fear wins over frustrated
        if (c.micLevel > MIC_THRESHOLD) {
            return fearLevel > 0.2 ? "fear" : "frustrated";
        }

        if (c.trustLevel >= 1 && relationshipLevel > 10) return "calm";
        if (c.trustLevel > 0.2)  return "untrusted";
        if (c.exciteTimer > 0)   return "excited";
        if (c.need <= 30)        return "happy";
        if (c.need <= 70)        return "neutral";
        return "distressed";
    }


    // ============================================================
    //  CREATURE FACTORY
    // ============================================================

    function createCreature() {
        return {
            currentNode:   0,
            targetNode:    1,
            previousNode:  -1,
            edgeT:         0,
            freezeTimer:   0,
            fearCurlTimer: 0,
            returningHome: false,
            trustLevel:    0,
            trustBuildRate: 0.001,
            comfortMode:   false,
            curled:        false,
            awayTooLong:   false,
            x: 0, y: 0,
            need:        50,
            state:       'neutral',
            bounceAmt:   0.02,
            bodyAlpha:   255,
            breathe:     0,
            bob:         0,
            exciteTimer: 0,
            orbitAngle:    0,
            celebrateTimer: 0,
            hour:          new Date().getHours(),
            isWatched:   true,
            micLevel:    0,
            lastVisit:   null,
            totalVisits: 0,
            selfCleanCooldown: 0,
            napping:     false,       // true during nighttime nap
            napEyeAlpha: 255,         // eyelid alpha for closing effect
            bodyR: 255, bodyG: 126, bodyB: 0,  // current lerped body colour
            sparkleTimer: 0,          // sparkle pulse counter for happy eyes
        };
    }

    let creature;
    let micAnalyser = null;
    let micActive   = false;
    let micData     = null;
    let ui          = {};


    // ============================================================
    //  PRELOAD
    // ============================================================

    p.preload = function() {
        bgBehind      = p.loadImage("bgbehind.png");
        bgImg         = p.loadImage("background.png");
        webLayer      = p.loadImage("web1.png");
        dropletsLayer = p.loadImage("droplets1.png");
        cloudImg     = p.loadImage("clouds1.png");   // FIX: consistent variable name
        debrisImg1    = p.loadImage("debris1.png");
        debrisImg2    = p.loadImage("debris2.png");
        envelopeImg   = p.loadImage("envelope.png");
        bouquetImg    = p.loadImage("bouquet.png");
        web2Img       = p.loadImage("web2.png");
        web3Img       = p.loadImage("web3.png");
        web4Img       = p.loadImage("web4.png");
        web5Img       = p.loadImage("web5.png");
        dragonflyImg  = p.loadImage("dragonfly.png");
        ladybugImg    = p.loadImage("ladybug.png");
        spiderShellImg = p.loadImage("spidershell.png");
    };


    // ============================================================
    //  SETUP
    // ============================================================

    function isMobile() { return window.innerWidth <= 768; }

    function canvasSize() {
        if (isMobile()) return { w: window.innerWidth, h: window.innerHeight };
        let maxW = p.windowWidth - 360;
        let maxH = p.windowHeight - 40;
        let targetRatio  = 16 / 9;
        let currentRatio = maxW / maxH;
        let w, h;
        if (currentRatio > targetRatio) { h = maxH; w = h * targetRatio; }
        else                            { w = maxW; h = w / targetRatio; }
        return { w, h };
    }

    p.setup = function() {
        let sz  = canvasSize();
        let cnv = p.createCanvas(sz.w, sz.h);
        cnv.mousePressed(onCanvasClick);
        cnv.parent('canvas-container');


        creature = createCreature();
        loadState(creature);

        cloudX = p.width + 200;
        cloudY = p.random(20, p.height * 0.4);

        // Bugs start hidden; they enter once relationship thresholds are met
        dragonfly.x = -9999;
        dragonfly.y = p.random(p.height * 0.15, p.height * 0.65);
        ladybug.x   = -9999;
        ladybug.y   = p.random(p.height * 0.15, p.height * 0.65);

        let startNode = WEB_NODES[creature.currentNode];
        creature.x = startNode.x * p.width;
        creature.y = startNode.y * p.height;

        for (let i = 0; i < 80; i++) {
            stars.push({
                x:       p.random(p.width),
                y:       p.random(p.height * 0.6),
                size:    p.random(2, 5),
                twinkle: p.random(0.5, 1.5),
            });
        }

        if (!SHOW_UI) document.querySelector('.sidebar').style.display = 'none';

        ui.hour         = document.getElementById('ui-hour');
        ui.period       = document.getElementById('ui-period');
        ui.day          = document.getElementById('ui-day');
        ui.state        = document.getElementById('ui-state');
        ui.desc         = document.getElementById('ui-desc');
        ui.needVal      = document.getElementById('ui-need-val');
        ui.needBar      = document.getElementById('ui-need-bar');
        ui.visits       = document.getElementById('ui-visits');
        ui.excited      = document.getElementById('ui-excited');
        ui.watched      = document.getElementById('ui-watched');
        ui.mic          = document.getElementById('ui-mic');
        ui.weather      = document.getElementById('ui-weather');
        ui.away         = document.getElementById('ui-away');
        ui.afk          = document.getElementById('ui-afk');
        ui.trustVal     = document.getElementById('ui-trust-val');
        ui.trustBar     = document.getElementById('ui-trust-bar');

        window.addEventListener('focus', () => {
            creature.isWatched = true;
            focusLostAt = null;
        });
        window.addEventListener('blur', () => {
            creature.isWatched = false;
            focusLostAt = Date.now();
        });

        setInterval(() => { saveState(creature); creature.hour = new Date().getHours(); }, 30000);
        window.addEventListener('beforeunload', () => saveState(creature));
    };


    // ============================================================
    //  RAIN
    // ============================================================

    function spawnRain() {
        for (let i = 0; i < 8; i++) {
            raindrops.push({
                x:     p.random(0, p.width),
                y:     p.random(-20, 0),
                len:   p.random(8, 14),
                speed: p.random(4, 8),
            });
        }
    }

    function drawRain() {
        p.stroke(255, 255, 255, 20);
        p.strokeWeight(1.2);
        for (let drop of raindrops) {
            p.line(drop.x, drop.y, drop.x, drop.y + drop.len);
            drop.y += drop.speed;
        }
        raindrops = raindrops.filter(d => d.y < p.height + 20);
    }


    // ============================================================
    //  DRAW LOOP
    // ============================================================

    const RAIN_CODES = new Set([51,53,55,61,63,65,80,81,82]);
    const WIND_CODES = new Set([95,96,99]);

    p.draw = function() {
        if (Date.now() - lastWeatherFetch >= 10 * 60 * 1000) fetchWeather();

        let col  = getBackgroundColor();
        let code = -1;
        let cloudy = false;

        if (weatherData && weatherData.current) {
            code   = weatherData.current.weather_code;
            cloudy = (code !== 0 && code !== 1);
        }

        let raining = RAIN_CODES.has(code);

        // Track rain duration
        if (raining) {
            if (rainStartTime === null) rainStartTime = Date.now();
        } else {
            rainStartTime = null;
        }
        rainActive = raining;

        // Fade droplets in after 5 minutes of rain
        let rainMinutes = rainStartTime !== null ? (Date.now() - rainStartTime) / 60000 : 0;
        dropletAlpha = rainMinutes > 5
            ? p.lerp(dropletAlpha, 255, 0.02)
            : p.lerp(dropletAlpha, 0,   0.02);

        // Wind trigger
        let windy = WIND_CODES.has(code);
        let loud  = creature.micLevel > MIC_THRESHOLD;
        windActive    = windy || loud;
        spiderBracing = windActive;

        if (windActive) { windSway += 0.04; }
        else            { windSway *= 0.9;  }

        // Background
        p.background(col[0], col[1], col[2]);

        // Stars (clear night only)
        let hour  = new Date().getHours();
        let clear = weatherData && weatherData.current && [0,1].includes(weatherData.current.weather_code);
        if (clear && (hour >= 20 || hour < 6)) {
            for (let s of stars) {
                let alpha = 200 + Math.sin(p.frameCount * 0.02 * s.twinkle) * 55;
                p.stroke(255, alpha);
                p.noFill();
                p.line(s.x - s.size, s.y, s.x + s.size, s.y);
                p.line(s.x, s.y - s.size, s.x, s.y + s.size);
            }
        }

        // Behind layer
        if (bgBehind) drawImageNoStretch(bgBehind);

        // Main background
        p.tint(255, 255);
        if (bgImg) drawImageNoStretch(bgImg);
        p.noTint();

        // Web + droplets (with optional wind sway)
        p.push();
        if (windActive) {
            p.translate(Math.sin(windSway) * 6, Math.cos(windSway) * 3);
        }

        let baseImg = currentWeb === 1 ? webLayer :
                      currentWeb === 2 ? web2Img  :
                      currentWeb === 3 ? web3Img  :
                      currentWeb === 4 ? web4Img  : web5Img;
        if (baseImg) drawImageNoStretch(baseImg);

        // Cross-fade to target web
        if (webFading && targetWeb !== null) {
            let elapsed  = Date.now() - fadeStartTime;
            webFade      = p.constrain(elapsed / fadeDuration, 0, 1);
            let targetImg = targetWeb === 1 ? webLayer :
                            targetWeb === 2 ? web2Img  :
                            targetWeb === 3 ? web3Img  :
                            targetWeb === 4 ? web4Img  : web5Img;
            if (targetImg) {
                p.tint(255, webFade * 255);
                drawImageNoStretch(targetImg);
                p.noTint();
            }
            if (webFade >= 1) {
                currentWeb = targetWeb;
                targetWeb  = null;
                webFading  = false;
            }
        }

        // Droplets overlay
        if (dropletsLayer && dropletAlpha > 1) {
            p.tint(255, dropletAlpha);
            drawImageNoStretch(dropletsLayer);
            p.noTint();
        }
        p.pop();

        // Envelope bounce
        if (envelopeBounce > 0) envelopeBounce *= 0.85;

        // Envelope — increased scale from 0.07 to 0.12 for bigger envelope
        if (envelopeImg) {
            let envW = envelopeImg.width  * 0.12;
            let envH = envelopeImg.height * 0.12;
            let envX = (p.width  - envW) / 2;
            let envY =  p.height - envH - 15;
            envelopeBounds = { x: envX, y: envY, w: envW, h: envH };
            p.image(envelopeImg, envX, envY - envelopeBounce, envW, envH);
        }

        // Debris spawn rate based on away time
        let spawnInterval = 800;
        if (!creature.isWatched) {
            if (focusAwayMinutes > 5)  spawnInterval = 140;
            if (focusAwayMinutes > 10) spawnInterval = 90;
            if (focusAwayMinutes > 20) spawnInterval = 50;
        }
 //  RANDOM DEBRIS SPAWN SYSTEM

// If it's time to spawn debris
if (Date.now() > nextDebrisSpawn) {

    spawnDebris();

    // Base random delay: 5–20 seconds
    let delay = p.random(5000, 20000);

    // Bad weather → debris falls much more often, overwhelming the spider
    if (rainActive && WIND_CODES.has(code)) {
        delay *= 0.15;   // storm: very rapid debris — hard for spider to cope alone
    } else if (rainActive) {
        delay *= 0.30;   // rain: noticeably faster
    } else if (WIND_CODES.has(code)) {
        delay *= 0.40;   // wind alone: moderately faster
    }

    // If user is away then spawn faster
    if (!creature.isWatched) {
        delay *= 0.5;    // half the delay
    }

    nextDebrisSpawn = Date.now() + delay;
}


        updateDebris();

        // Clouds — always moving right-to-left; fade in when cloudy, fade out on clear
        if (cloudy) {
            cloudAlpha = p.lerp(cloudAlpha, 255, 0.02);
        } else {
            cloudAlpha = p.lerp(cloudAlpha, 0, 0.015); // gentle fade-out on clear sky
        }

        // Keep cloud moving at all times so it loops even while fading
        if (cloudImg) {
            cloudX -= cloudSpeed;
            // Loop back from left edge to right edge
            if (cloudX + cloudImg.width * 1.2 < 0) {
                cloudX = p.width + p.random(50, 200);
                cloudY = p.random(20, p.height * 0.4);
            }
            if (cloudAlpha > 1) {
                p.tint(255, cloudAlpha);
                p.image(cloudImg, cloudX, cloudY, cloudImg.width * 1.2, cloudImg.height * 1.2);
                p.noTint();
            }
        }

        // Rain
        if (rainActive) { spawnRain(); drawRain(); }

        // Creature update + draw
        updateMic(creature);

        // ── Clear sky spontaneous web change ──
        let isClearSky = weatherData && weatherData.current && [0,1].includes(weatherData.current.weather_code);
        if (isClearSky) {
            if (clearSkyStart === null) clearSkyStart = Date.now();
            let clearMinutes = (Date.now() - clearSkyStart) / 60000;
            // After 60min clear sky, relationship > 20: random chance to change web
            if (clearMinutes >= 60 && relationshipLevel > 20 && !webFading && Date.now() > nextClearWebChange) {
                if (p.random() < 0.0003) { // low per-frame chance so it feels spontaneous
                    startWebFade();
                    nextClearWebChange = Date.now() + p.random(300000, 600000); // 5–10min cooldown
                }
            }
        } else {
            clearSkyStart = null;
        }

        // ── Rain worry after 10 minutes ──
        let rainMinutesNow = rainStartTime !== null ? (Date.now() - rainStartTime) / 60000 : 0;
        if (rainMinutesNow > 10) {
            rainWorryTimer = Math.min(rainWorryTimer + 1, 300);
        } else {
            rainWorryTimer = Math.max(0, rainWorryTimer - 2);
        }

        // ── Smiley face: appears as greeting when relationship >= 30 on first visit back ──
        if (!smileyShown && relationshipLevel >= 30 && creature.totalVisits > 1 && p.frameCount === 180) {
            spawnSmileyFace();
            smileyShown = true;
        }

        updateCreature(creature);
        updateDragonfly();   // update + draw dragonfly (spider renders on top)
        updateLadybug();     // update + draw ladybug

        // Calm company tracking
        if (creature.isWatched && creature.micLevel < 0.05 && frustrationTimer === 0) {
            calmVisitTime++;
            if (calmVisitTime % (60 * 10) === 0) {
                connectionLevel = Math.min(1, connectionLevel + 0.05);
            }
        }
        if (!creature.isWatched) {
            connectionLevel = Math.max(0, connectionLevel - 0.0002);
        }

        if (!webFading && currentWeb !== 1 && relationshipLevel < 5) {
            targetWeb     = 1;
            webFading     = true;
            fadeStartTime = Date.now();
            webFade       = 0;
            fadeDuration  = 5000;
        }

        drawCreature(creature);

        // Bouquet
        if (bouquetAvailable && bouquet) {
            p.push();
            p.translate(bouquet.x, bouquet.y);
            p.image(bouquetImg, -bouquet.size / 2, -bouquet.size / 2, bouquet.size, bouquet.size);
            p.pop();
        }

        if (p.frameCount % 6 === 0) updateSidebar(creature);
    };


    // ============================================================
    //  DRAGONFLY
    // ============================================================

    function resetDragonfly() {
        dragonfly.x       = -9999;  // hidden off screen
        dragonfly.y       = p.random(p.height * 0.15, p.height * 0.65);
        dragonfly.speed   = p.random(1.4, 2.0);   // slightly faster than before
        dragonfly.alive   = true;
        dragonfly.stuck   = false;
        dragonfly.stuckNode = null;
        dragonfly.dragging = false;
        dragonfly.eatTimer = 0;
        dragonfly.eaten   = false;
        dragonfly.size    = 70;
        dragonfly.naturalCatchCooldown = 0;
        dragonfly.active  = false;
        // Long delay before next appearance: 60–120 seconds
        nextDragonflySpawn = Date.now() + p.random(60000, 120000);
    }

    function updateDragonfly() {
        if (!dragonflyImg) return;

        // Gate: only appear when relationship >= 15
        if (!dragonfly.active && relationshipLevel < 15) return;

        // Activate when delay has passed
        if (!dragonfly.active && Date.now() > nextDragonflySpawn) {
            dragonfly.active = true;
            dragonfly.x      = -150;
            dragonfly.y      = p.random(p.height * 0.15, p.height * 0.65);
            dragonfly.naturalCatchCooldown = p.random(900, 2400); // 15–40s cooldown
        }
        if (!dragonfly.active) return;

        let df = dragonfly;
        df.wiggle += 0.12;

        if (df.naturalCatchCooldown > 0) df.naturalCatchCooldown--;

        // ── Being eaten ──
        if (df.eaten) {
            eatingLock = true;
            df.eatTimer++;
            creature.x = p.lerp(creature.x, df.x, 0.06);
            creature.y = p.lerp(creature.y, df.y, 0.06);
            df.size    = p.lerp(df.size, 0, 0.025);
            // Wiggle while being consumed
            let wx = Math.sin(df.wiggle * 1.2) * (df.size * 0.08);
            let wy = Math.cos(df.wiggle * 0.9) * (df.size * 0.05);
            p.push();
            p.translate(df.x + wx, df.y + wy);
            p.rotate(Math.sin(df.wiggle * 0.5) * 0.15);
            p.image(dragonflyImg, -df.size / 2, -df.size / 2, df.size, df.size);
            p.pop();
            if (df.size < 2) {
                relationshipLevel = Math.min(100, relationshipLevel + 5);
                eatingLock = false;
                resetDragonfly();
            }
            return;
        }

        // ── Stuck in web ──
        if (df.stuck) {
            let wx = Math.sin(df.wiggle * 0.7) * 3;
            let wy = Math.cos(df.wiggle * 0.5) * 2;
            p.push();
            p.translate(df.x + wx, df.y + wy);
            p.rotate(Math.sin(df.wiggle * 0.35) * 0.1);
            p.image(dragonflyImg, -df.size / 2, -df.size / 2, df.size, df.size);
            p.pop();
            if (p.dist(creature.x, creature.y, df.x, df.y) < 55) {
                df.eaten = true;
            }
            return;
        }

        // ── Dragging by user ──
        if (df.dragging) {
            df.x = p.mouseX + df.offsetX;
            df.y = p.mouseY + df.offsetY;
            p.push();
            p.translate(df.x, df.y);
            p.image(dragonflyImg, -df.size / 2, -df.size / 2, df.size, df.size);
            p.pop();
            return;
        }

        // ── Flying freely ──
        df.x += df.speed;
        df.y += Math.sin(df.wiggle * 0.4) * 0.5;
        let wingScale = 1 + Math.sin(df.wiggle * 2.2) * 0.07;
        p.push();
        p.translate(df.x, df.y);
        p.rotate(Math.sin(df.wiggle * 0.3) * 0.06);
        p.scale(wingScale, 1);
        p.image(dragonflyImg, -df.size / 2, -df.size / 2, df.size, df.size);
        p.pop();

        // ── Natural catch — rare ──
        if (df.naturalCatchCooldown <= 0) {
            for (let n of WEB_NODES) {
                let nx = n.x * p.width, ny = n.y * p.height;
                if (p.dist(df.x, df.y, nx, ny) < 35 && p.random() < 0.002) {
                    df.stuck = true; df.stuckNode = n.id;
                    df.x = nx; df.y = ny;
                    return;
                }
            }
        }

        if (df.x > p.width + 150) resetDragonfly();
    }


    // ============================================================
    //  LADYBUG
    // ============================================================

    function resetLadybug() {
        ladybug.x       = -9999;
        ladybug.y       = p.random(p.height * 0.1, p.height * 0.7);
        ladybug.speed   = p.random(2.4, 3.6);   // fast
        ladybug.stuck   = false;
        ladybug.stuckNode = null;
        ladybug.dragging = false;
        ladybug.eaten   = false;
        ladybug.size    = 45;
        ladybug.naturalCatchCooldown = 0;
        ladybug.active  = false;
        // Ladybug appears less often than dragonfly
        nextLadybugSpawn = Date.now() + p.random(90000, 180000);
    }

    function updateLadybug() {
        if (!ladybugImg) return;

        // Gate: same relationship threshold as dragonfly
        if (!ladybug.active && relationshipLevel < 15) return;

        if (!ladybug.active && Date.now() > nextLadybugSpawn) {
            ladybug.active = true;
            ladybug.x      = -80;
            ladybug.y      = p.random(p.height * 0.1, p.height * 0.7);
            ladybug.naturalCatchCooldown = p.random(1200, 3000); // very long — hard to catch
        }
        if (!ladybug.active) return;

        let lb = ladybug;
        lb.wiggle += 0.22;  // faster wing wiggle

        if (lb.naturalCatchCooldown > 0) lb.naturalCatchCooldown--;

        // ── Being eaten ──
        if (lb.eaten) {
            eatingLock = true;
            lb.size    = p.lerp(lb.size, 0, 0.028);
            creature.x = p.lerp(creature.x, lb.x, 0.07);
            creature.y = p.lerp(creature.y, lb.y, 0.07);
            let wx = Math.sin(lb.wiggle * 1.5) * (lb.size * 0.1);
            let wy = Math.cos(lb.wiggle * 1.1) * (lb.size * 0.06);
            p.push();
            p.translate(lb.x + wx, lb.y + wy);
            p.rotate(Math.sin(lb.wiggle * 0.6) * 0.18);
            p.image(ladybugImg, -lb.size / 2, -lb.size / 2, lb.size, lb.size);
            p.pop();
            if (lb.size < 2) {
                relationshipLevel = Math.min(100, relationshipLevel + 5);
                eatingLock = false;
                resetLadybug();
            }
            return;
        }

        // ── Stuck in web ──
        if (lb.stuck) {
            let wx = Math.sin(lb.wiggle * 1.0) * 2.5;
            let wy = Math.cos(lb.wiggle * 0.8) * 1.5;
            p.push();
            p.translate(lb.x + wx, lb.y + wy);
            p.rotate(Math.sin(lb.wiggle * 0.5) * 0.14);
            p.image(ladybugImg, -lb.size / 2, -lb.size / 2, lb.size, lb.size);
            p.pop();
            if (p.dist(creature.x, creature.y, lb.x, lb.y) < 45) {
                lb.eaten = true;
            }
            return;
        }

        // ── Dragging by user ──
        if (lb.dragging) {
            lb.x = p.mouseX + lb.offsetX;
            lb.y = p.mouseY + lb.offsetY;
            p.push();
            p.translate(lb.x, lb.y);
            p.image(ladybugImg, -lb.size / 2, -lb.size / 2, lb.size, lb.size);
            p.pop();
            return;
        }

        // ── Flying freely — fast, erratic ──
        lb.x += lb.speed;
        lb.y += Math.sin(lb.wiggle * 0.7) * 1.0;  // more erratic vertical wobble
        let wingScale = 1 + Math.sin(lb.wiggle * 3.0) * 0.06;
        p.push();
        p.translate(lb.x, lb.y);
        p.rotate(Math.sin(lb.wiggle * 0.5) * 0.09);
        p.scale(wingScale, 1);
        p.image(ladybugImg, -lb.size / 2, -lb.size / 2, lb.size, lb.size);
        p.pop();

        // ── Natural catch — very rare (harder than dragonfly) ──
        if (lb.naturalCatchCooldown <= 0) {
            for (let n of WEB_NODES) {
                let nx = n.x * p.width, ny = n.y * p.height;
                if (p.dist(lb.x, lb.y, nx, ny) < 25 && p.random() < 0.001) {
                    lb.stuck = true; lb.stuckNode = n.id;
                    lb.x = nx; lb.y = ny;
                    return;
                }
            }
        }

        if (lb.x > p.width + 100) resetLadybug();
    }


    // ============================================================
    //  SMILEY FACE DEBRIS ARRANGEMENT
    // ============================================================

    function spawnSmileyFace() {
        // Place debris in a smiley face pattern around web centre
        // Uses fixed node positions to approximate eyes + smile
        let cx = p.width  * 0.55;
        let cy = p.height * 0.40;
        let r  = 60;

        // Two eyes
        let eyePositions = [
            { x: cx - 22, y: cy - 18 },
            { x: cx + 22, y: cy - 18 },
        ];
        // Smile arc — 5 points
        let smileAngles = [-0.6, -0.3, 0, 0.3, 0.6];
        let smilePositions = smileAngles.map(a => ({
            x: cx + Math.sin(a) * r * 0.55,
            y: cy + 14 + Math.cos(a) * -14,
        }));

        for (let pos of [...eyePositions, ...smilePositions]) {
            let img = p.random([debrisImg1, debrisImg2]);
            let d = {
                x: pos.x, y: pos.y,
                img, size: p.random(20, 30),
                speed: 0, rotation: 0, angle: 0,
                stuck: true, stuckNode: null,
                dragging: false, released: false,
                offsetX: 0, offsetY: 0,
                isSmiley: true,   // flag so it can't be auto-cleaned
            };
            debris.push(d);
            smileyDebris.push(d);
        }
        smileyActive = true;
    }

    function getNeighbours(nodeId) {
        let neighbours = [];
        for (let [a, b] of WEB_EDGES) {
            if (a === nodeId) neighbours.push(b);
            else if (b === nodeId) neighbours.push(a);
        }
        return neighbours;
    }

    function nodeDist(idA, idB) {
        let a = WEB_NODES[idA], b = WEB_NODES[idB];
        return p.dist(a.x * p.width, a.y * p.height, b.x * p.width, b.y * p.height);
    }

    function distToMouse(nodeId) {
        let n = WEB_NODES[nodeId];
        return p.dist(n.x * p.width, n.y * p.height, p.mouseX, p.mouseY);
    }

    function pickNextNode(c) {
        let neighbours = getNeighbours(c.currentNode);
        if (neighbours.length === 0) return c.currentNode;

        // Chase nearest stuck bug (dragonfly or ladybug)
        let bugTarget = null;
        let bugDist   = Infinity;
        for (let bug of [dragonfly, ladybug]) {
            if (bug.stuck && !bug.eaten) {
                let d = p.dist(c.x, c.y, bug.x, bug.y);
                if (d < bugDist) { bugDist = d; bugTarget = bug; }
            }
        }
        if (bugTarget) {
            // Move toward the node nearest to the stuck bug
            return neighbours.sort((a, b) => {
                let na = WEB_NODES[a], nb = WEB_NODES[b];
                let da = p.dist(na.x * p.width, na.y * p.height, bugTarget.x, bugTarget.y);
                let db = p.dist(nb.x * p.width, nb.y * p.height, bugTarget.x, bugTarget.y);
                return da - db;
            })[0];
        }

        switch (c.state) {
            case 'happy':
            case 'neutral': {
                let opts = neighbours.filter(n => n !== c.previousNode);
                return p.random(opts.length > 0 ? opts : neighbours);
            }
            case 'distressed':
                return neighbours.sort((a, b) => nodeDist(a, 0) - nodeDist(b, 0))[0];
            case 'excited':
                return neighbours.sort((a, b) => distToMouse(a) - distToMouse(b))[0];
            default:
                return p.random(neighbours);
        }
    }


    // ============================================================
    //  CREATURE LOGIC
    // ============================================================

    function updateCreature(c) {

// Celebration circles after receiving bouquet
if (c.celebrateTimer > 0) {
    c.celebrateTimer--;

    // Circle around center of screen
    c.orbitAngle += 0.15;
    c.x = p.width/2  + Math.cos(c.orbitAngle) * 90;
    c.y = p.height/2 + Math.sin(c.orbitAngle) * 90;

    // During celebration, spider is calm
    c.state = "calm";
    return;
}


        // Freeze
        if (c.freezeTimer > 0) {
            c.freezeTimer--;
            c.state = "frustrated";
            return;
        }

        // Fear curl
        if (c.fearCurlTimer > 0) {
            c.fearCurlTimer--;
            c.state = "fear";
            c.curled = true;
            return;
        }

        // Celebration orbit during web fade — slow gentle circles
        if (webFading) {
            c.orbitAngle += 0.07;  // was 0.2 — much slower, more graceful
            c.x = p.width  / 2 + Math.cos(c.orbitAngle) * 80;
            c.y = p.height / 2 + Math.sin(c.orbitAngle) * 80;
            return;
        }

        // Nap: spider stops and stays at hub node
        if (c.state === "nap") {
            c.napping = true;
            let hub = WEB_NODES[0];
            c.x = p.lerp(c.x, hub.x * p.width,  0.03);
            c.y = p.lerp(c.y, hub.y * p.height, 0.03);
            c.breathe += 0.005; // very slow breathing
            return;
        }
        c.napping = false;

        // Freeze on eating — spider stays still until bug is consumed
        if (eatingLock) {
            c.breathe += 0.018;
            return;
        }

        // Frustration cooldown
        if (frustrationTimer > 0) {
            frustrationTimer = Math.floor(frustrationTimer * 0.995) - 1;
            c.state = "frustrated";
        }

        if (c.awayTooLong) c.returningHome = true;

        if (c.isWatched && c.curled) {
            c.curled      = false;
            c.awayTooLong = false;
        }

        // FIX: single declaration of stuckCount
        let stuckCount = debris.filter(d => d.stuck).length;
        if (stuckCount >= 3) c.returningHome = true;

        // Need decay
        if (c.state === 'calm') {
            c.need = p.constrain(c.need - 0.02, 0, 100);
        } else {
            let rate = c.isWatched ? DECAY_RATE : AWAY_RATE;
            c.need = p.constrain(c.need + rate, 0, 100);
        }

        // Trust build / decay
        if (c.isWatched && c.micLevel < 0.05) {
            c.trustLevel = Math.min(1, c.trustLevel + c.trustBuildRate);
        } else {
            let loss = c.isWatched ? 0.005 : 0.02;
            c.trustLevel = Math.max(0, c.trustLevel - loss);
        }

        // Relationship meter — passive calm presence still slowly builds it,
        // but active actions (debris, bouquet, visits) are the main drivers.
        // Decay is gentle so hard-earned points aren't lost too quickly.
        if (c.state === "calm" && c.micLevel < 0.05 && c.isWatched) {
            relationshipLevel = Math.min(100, relationshipLevel + 0.003); // slow passive build
        } else {
            relationshipLevel = Math.max(0, relationshipLevel - 0.005);   // gentle decay
        }
        if (!c.isWatched || c.state === "frustrated" || c.micLevel > MIC_THRESHOLD) {
            relationshipLevel = Math.max(0, relationshipLevel - 0.005);
        }

        // Comfort mode
        if (c.state === "calm" && c.micLevel < 0.05 && c.isWatched) {
            calmVisitTime++;
            if (calmVisitTime > 60 * 20) c.comfortMode = true;
        } else {
            calmVisitTime  = 0;
            c.comfortMode  = false;
        }

        // Fear / frustration from debris
        // In bad weather the threshold lowers — storms make the spider more anxious
        let fearThreshold = (rainActive || WIND_CODES.has(weatherData?.current?.weather_code ?? -1)) ? 6 : 8;
        let frustThreshold = fearThreshold - 2; // frustrated 2 below fear threshold
        if (stuckCount > fearThreshold) {
            fearLevel = Math.min(1, fearLevel + 0.002);
        } else {
            fearLevel = Math.max(0, fearLevel - 0.01);
        }
        if (stuckCount >= frustThreshold && stuckCount <= fearThreshold) {
            c.state = "frustrated";
        }

        // Self-cleaning: if fewer than 5 debris stuck, spider slowly removes one
        if (stuckCount > 0 && stuckCount < 5) {
            let currentNodeId = c.currentNode;
            let debrisHere = debris.find(d => d.stuck && d.stuckNode === currentNodeId && !d.isSmiley);
            if (debrisHere && !c.selfCleanCooldown) {
                c.selfCleanCooldown = 300;
                debrisHere.selfCleanTimer = 120;
            }
        }
        if (c.selfCleanCooldown > 0) c.selfCleanCooldown--;


        // State + animation
        c.state     = getState(c);
        let s       = STATES[c.state];
        c.bounceAmt = p.lerp(c.bounceAmt, s.bounceAmt * BOUNCE_SCALE, 0.08);
        c.bodyAlpha = p.lerp(c.bodyAlpha, s.alphaTarget, 0.05);

        // Speed by mood
        if (c.state === 'worried' || c.state === 'frustrated') travelSpeed = BASE_SPEED * 2.2;
        else if (c.state === 'calm')                           travelSpeed = BASE_SPEED * 0.4;
        else                                                   travelSpeed = BASE_SPEED;

        c.breathe += 0.018;
        c.bob     += 0.012;
        if (c.exciteTimer > 0) c.exciteTimer--;

        // Travel along edge
        c.edgeT += travelSpeed;
        if (c.edgeT >= 1.0) {
            c.previousNode = c.currentNode;
            c.currentNode  = c.targetNode;
            c.edgeT        = 0;

            if (c.returningHome) {
                let neighbours = getNeighbours(c.currentNode);
                c.targetNode   = neighbours.sort((a, b) => nodeDist(a, 0) - nodeDist(b, 0))[0];
                if (c.currentNode === 0) {
                    c.curled        = !!c.awayTooLong;
                    c.returningHome = false;
                }
            } else {
                c.targetNode = pickNextNode(c);
            }
        }

        // Pixel position
        let cur = WEB_NODES[c.currentNode];
        let tgt = WEB_NODES[c.targetNode];
        c.x = p.lerp(cur.x * p.width,  tgt.x * p.width,  c.edgeT);
        c.y = p.lerp(cur.y * p.height, tgt.y * p.height, c.edgeT);
    }


    // ============================================================
    //  DEBRIS
    // ============================================================

    function spawnDebris() {
        let img = p.random([debrisImg1, debrisImg2]);
        debris.push({
            x:        p.random(0, p.width),
            y:        -20,
            img:      img,
            size:     p.random(28, 48),
            speed:    p.random(0.4, 1.0),  // slower fall, rotates as it falls
            rotation: p.random(-0.1, 0.1),
            angle:    0,
            stuck:    false,
            stuckNode: null,
            dragging: false,
            released: false,
            offsetX:  0,
            offsetY:  0,
        });
    }

    function nodeHasDebris(nodeId) {
        return debris.some(d => d.stuck && d.stuckNode === nodeId);
    }

    function updateDebris() {
        let anyFalling = false;

        for (let d of debris) {
            if (d.dragging) {
                d.x = p.mouseX + d.offsetX;
                d.y = p.mouseY + d.offsetY;
                p.image(d.img, d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
                continue;
            }

            if (d.released) {
                d.y += d.speed * 1.2;
                p.push();
                d.angle += d.rotation;
                p.translate(d.x, d.y);
                p.rotate(d.angle);
                p.image(d.img, -d.size / 2, -d.size / 2, d.size, d.size);
                p.pop();
                continue;
            }

            if (d.stuck) {
                // Self-clean countdown — spider removes this debris on its own
                if (d.selfCleanTimer !== undefined && d.selfCleanTimer > 0) {
                    d.selfCleanTimer--;
                    if (d.selfCleanTimer <= 0) {
                        // Mark for removal — release it falling off the web
                        d.stuck    = false;
                        d.released = true;
                        d.speed    = p.random(1.0, 2.0);
                    }
                }
                p.push();
                if (windActive) p.translate(Math.sin(windSway) * 4, Math.cos(windSway) * 2);
                p.image(d.img, d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
                p.pop();
                continue;
            }

            // Falling — slower speed, rotates as it falls
            d.y     += d.speed;
            d.angle += d.rotation;   // accumulate rotation each frame
            anyFalling = true;

            // Stick to nearest node
            for (let n of WEB_NODES) {
                let nx = n.x * p.width;
                let ny = n.y * p.height;
                if (p.dist(d.x, d.y, nx, ny) < 12 && !nodeHasDebris(n.id)) {
                    d.stuck     = true;
                    d.stuckNode = n.id;
                    d.x         = nx;
                    d.y         = ny;
                    d.angle     = 0; // reset rotation when stuck
                    break;
                }
            }

            // Draw with accumulated rotation
            p.push();
            p.translate(d.x, d.y);
            p.rotate(d.angle);
            p.image(d.img, -d.size / 2, -d.size / 2, d.size, d.size);
            p.pop();
        }

        // Track rapid debris falls — only scary if already overwhelmed (>5 stuck)
        let now = Date.now();
        if (anyFalling) recentDebrisFalls.push(now);
        recentDebrisFalls = recentDebrisFalls.filter(t => now - t < 3000);
        if (recentDebrisFalls.length >= 8 && debris.filter(d => d.stuck).length > 5) {
            fearLevel = Math.min(1, fearLevel + 0.25);
        }
        fearLevel = Math.max(0, fearLevel - 0.002);

        debris = debris.filter(d => d.y < p.height + 40);
    }


    // ============================================================
    //  WEB FADE TRIGGER
    // ============================================================

    function startWebFade() {
        const ALL_WEBS = [1, 2, 3, 4, 5];

        if (relationshipLevel >= 50) {
            // Prefer unseen webs first
            let unseen = ALL_WEBS.filter(w => !seenWebs.has(w) && w !== currentWeb);
            if (unseen.length > 0) {
                targetWeb = p.random(unseen);
            } else {
                let opts = ALL_WEBS.filter(w => w !== currentWeb);
                targetWeb = p.random(opts);
            }
        } else if (relationshipLevel >= 20) {
            // Mid relationship — webs 1–3
            let opts = [1, 2, 3].filter(w => w !== currentWeb);
            targetWeb = p.random(opts);
        } else {
            // Low relationship — web 2 only
            targetWeb = currentWeb !== 2 ? 2 : 1;
        }

        seenWebs.add(targetWeb);
        webFading     = true;
        fadeStartTime = Date.now();
        webFade       = 0;
        fadeDuration  = 15000;
        creature.exciteTimer = 600;
    }


    // ============================================================
    //  PROCEDURAL WEB (debug / fallback)
    // ============================================================

    function drawProceduralWeb() {
        p.push();
        p.stroke(255, 255, 255, 20);
        p.noFill();
        let hub  = WEB_NODES[0];
        let rings = {};
        for (let n of WEB_NODES) {
            if (n.id === 0) continue;
            p.strokeWeight(1.2);
            p.line(hub.x * p.width, hub.y * p.height, n.x * p.width, n.y * p.height);
            let d = p.dist(hub.x, hub.y, n.x, n.y);
            let bucket = Math.round(d * 6);
            if (!rings[bucket]) rings[bucket] = [];
            rings[bucket].push(n);
        }
        p.stroke(255, 255, 255, 60);
        p.strokeWeight(1);
        for (let r in rings) {
            let ring = rings[r];
            if (ring.length < 2) continue;
            p.beginShape();
            for (let n of ring) p.curveVertex(n.x * p.width, n.y * p.height);
            p.curveVertex(ring[0].x * p.width, ring[0].y * p.height);
            p.endShape();
        }
        p.pop();
    }


    // ============================================================
    //  DRAWING
    // ============================================================

    function drawCreature(c) {
        // ── Dynamic size: smaller base, grows with relationship ──
        // Base = 80, max = 120 at relationship 100
        let dynamicSize = 80 + (relationshipLevel / 100) * 40;

        // ── Body colour lerp: orange→purple (fear), orange→yellow (calm/happy) ──
        let targetR, targetG, targetB;
        if (c.state === "fear" || c.state === "distressed") {
            // Purple-ish
            targetR = 160; targetG = 60; targetB = 200;
        } else if (c.state === "calm" || c.state === "comfort" || c.state === "nap") {
            // Warm yellow
            targetR = 255; targetG = 210; targetB = 40;
        } else if (c.state === "happy") {
            // Slightly gold
            targetR = 255; targetG = 190; targetB = 60;
        } else {
            // Default orange
            targetR = 255; targetG = 126; targetB = 0;
        }
        c.bodyR = p.lerp(c.bodyR, targetR, 0.03);
        c.bodyG = p.lerp(c.bodyG, targetG, 0.03);
        c.bodyB = p.lerp(c.bodyB, targetB, 0.03);

        // ── Sparkle timer for happy/calm eyes ──
        if ((c.state === "happy" || c.state === "calm") && relationshipLevel >= 30) {
            c.sparkleTimer += 1;
        } else {
            c.sparkleTimer = 0;
        }

        p.push();
        p.translate(c.x, c.y);
        p.translate(0, p.sin(c.bob) * 4);

        if (spiderBracing) { p.translate(0, 6); p.scale(1.05, 0.92); }
        if (c.comfortMode) { p.translate(0, Math.sin(c.breathe * 0.5) * 3); p.scale(1.05); }

        if (c.curled) {
            p.scale(0.6);
            c.bounceAmt = 0;
            c.bodyAlpha = 255;
            p.translate(p.random(-3, 3), p.random(-1.5, 1.5));
        }

        let s = STATES[c.state] || STATES.neutral;
        let bScale = 1 + p.sin(c.breathe) * c.bounceAmt;

        if (s.shakeAmt > 0) {
            p.translate(
                p.random(-s.shakeAmt, s.shakeAmt),
                p.random(-s.shakeAmt * 0.4, s.shakeAmt * 0.4)
            );
        }
        if (c.state === "frustrated") p.translate(p.random(-1.5, 1.5), p.random(-0.5, 0.5));
        if (c.state === "worried")    p.translate(p.random(-1, 1), p.random(-0.5, 0.5));
        if (c.state === "fear")       p.translate(p.random(-2, 2), p.random(-1, 1));

        let cur   = WEB_NODES[c.currentNode];
        let tgt   = WEB_NODES[c.targetNode];
        let angle = Math.atan2((tgt.y - cur.y) * p.height, (tgt.x - cur.x) * p.width);
        p.rotate(angle + p.HALF_PI);

        let sc = dynamicSize / 55.0 * bScale;
        p.scale(sc);

        drawSpider(c);
        p.pop();
    }


    // ============================================================
    //  SPIDER DRAWING
    // ============================================================

    function drawSpider(c) {
        let alpha   = c.bodyAlpha;
        let isNapping = c.state === "nap";

        if (isNapping) {
            // Legs tuck in close to body
            drawLegsNap(alpha, c);
        } else {
            let legSway = p.sin(c.breathe * 1.3) * 2.5;
            drawLegs(alpha, legSway, c);
        }
        drawPedipalps(alpha);
        drawBody(alpha, c);
        drawEyes(c, alpha, isNapping);
    }

    function drawLegs(alpha, sway, c) {
        p.strokeWeight(1.5);
        p.noFill();
        let brace = spiderBracing ? 6 : 0;
        if (c.state === "frustrated") sway *= 0.3;
        if (c.state === "fear")       sway  = 0;
        // Fear: legs partially tucked — shorter reach, pulled inward
        let fearTuck = (c.state === "fear") ? 0.55 : 1.0;
        let ls = sway + brace;
        let rs = -sway - brace;
        p.stroke(...BLACK, alpha);
        drawLeg(-8*fearTuck,  -8,  -14*fearTuck, -16+ls, -24*fearTuck, -18+ls, -26*fearTuck, -12+ls, alpha);
        drawLeg(-10*fearTuck, -2,  -16*fearTuck,  -6+ls, -28*fearTuck,  -2+ls, -30*fearTuck,   4+ls, alpha);
        drawLeg(-10*fearTuck,  4,  -14*fearTuck,   8+ls, -24*fearTuck,  14+ls, -26*fearTuck,  20+ls, alpha);
        drawLeg(-8*fearTuck,  10,  -10*fearTuck,  16+ls, -16*fearTuck,  22+ls, -16*fearTuck,  28+ls, alpha);
        drawLeg( 8*fearTuck,  -8,   14*fearTuck, -16+rs,  24*fearTuck, -18+rs,  26*fearTuck, -12+rs, alpha);
        drawLeg(10*fearTuck,  -2,   16*fearTuck,  -6+rs,  28*fearTuck,  -2+rs,  30*fearTuck,   4+rs, alpha);
        drawLeg(10*fearTuck,   4,   14*fearTuck,   8+rs,  24*fearTuck,  14+rs,  26*fearTuck,  20+rs, alpha);
        drawLeg( 8*fearTuck,  10,   10*fearTuck,  16+rs,  16*fearTuck,  22+rs,  16*fearTuck,  28+rs, alpha);
    }

    // Nap: legs fully tucked under body — small folded curves
    function drawLegsNap(alpha, c) {
        p.strokeWeight(1.2);
        p.noFill();
        p.stroke(...BLACK, alpha * 0.7);
        // Very short tucked legs, barely visible under the body
        drawLeg(-6, -6,  -10, -10, -14, -10,  -13, -6,  alpha * 0.7);
        drawLeg(-7, -1,  -11,  -3, -14,  -1,  -13,  3,  alpha * 0.7);
        drawLeg(-7,  4,  -11,   7, -13,  10,  -12, 14,  alpha * 0.7);
        drawLeg(-6,  9,   -9,  12, -12,  14,  -11, 18,  alpha * 0.7);
        drawLeg( 6, -6,   10, -10,  14, -10,   13, -6,  alpha * 0.7);
        drawLeg( 7, -1,   11,  -3,  14,  -1,   13,  3,  alpha * 0.7);
        drawLeg( 7,  4,   11,   7,  13,  10,   12, 14,  alpha * 0.7);
        drawLeg( 6,  9,    9,  12,  12,  14,   11, 18,  alpha * 0.7);
    }

    function drawLeg(x0,y0,cx1,cy1,cx2,cy2,x3,y3,alpha) {
        p.stroke(...BLACK, alpha);
        p.beginShape();
        p.vertex(x0, y0);
        p.bezierVertex(cx1, cy1, cx2, cy2, x3, y3);
        p.endShape();
    }

    // FIX: removed unused 'c' parameter
    function drawPedipalps(alpha) {
        p.stroke(...BLACK, alpha);
        p.strokeWeight(1.5);
        p.noFill();
        p.beginShape();
        p.vertex(-4, -14);
        p.bezierVertex(-8, -22, -12, -26, -8, -31);
        p.endShape();
        p.beginShape();
        p.vertex(4, -14);
        p.bezierVertex(8, -22, 12, -26, 8, -31);
        p.endShape();
    }

    function drawBody(alpha, c) {
        let br = c ? c.bodyR : 255;
        let bg = c ? c.bodyG : 126;
        let bb = c ? c.bodyB : 0;
        let hr = br * 0.75, hg = bg * 0.67, hb = bb * 0.6;
        p.noStroke();
        p.fill(br, bg, bb, alpha);
        p.ellipse(0, 9, 32, 30);
        p.fill(hr, hg, hb, alpha);
        p.ellipse(0, -7, 24, 20);
        p.stroke(...BLACK, alpha * 0.5);
        p.strokeWeight(0.8);
        p.noFill();
        p.ellipse(0,  9, 32, 30);
        p.ellipse(0, -7, 24, 20);
        p.noStroke();
        p.fill(...BLACK, alpha);
        p.ellipse(0, 1, 7, 6);

        // Shell overlay on abdomen — centred over the butt ellipse
        if (spiderShellImg) {
            p.tint(255, alpha);
            p.image(spiderShellImg, -16, -2, 32, 30);
            p.noTint();
        }
    }

    function drawEyes(c, alpha, isNapping) {
        // Eyes follow the nearest visible bug if closer than the cursor
        let targetX = p.mouseX;
        let targetY = p.mouseY;
        let mouseDist = p.dist(c.x, c.y, p.mouseX, p.mouseY);

        function checkBug(bug) {
            if (!bug.active || bug.eaten) return;
            if (bug.x < -200 || bug.x > p.width + 200) return;
            let bd = p.dist(c.x, c.y, bug.x, bug.y);
            if (bd < mouseDist) { targetX = bug.x; targetY = bug.y; mouseDist = bd; }
        }
        if (dragonflyImg) checkBug(dragonfly);
        if (ladybugImg)   checkBug(ladybug);
        let dx    = targetX - c.x;
        let dy    = targetY - c.y;
        let angle = Math.atan2(dy, dx);
        let lookX = Math.cos(angle) * 1.2;
        let lookY = Math.sin(angle) * 1.2;
        let pupilBig = c.state === 'excited';
        let squash   = c.state === "frustrated" ? 0.6 : c.state === "fear" ? 0.4 : 1.0;

        let front = [[-7,-11],[-2.5,-13],[2.5,-13],[7,-11]];
        let back  = [[-6,-7.5],[-2,-9],[2,-9],[6,-7.5]];

        if (isNapping) {
            // Draw closed eyelids — simple horizontal lines through each eye position
            p.stroke(...BLACK, alpha * 0.8);
            p.strokeWeight(1.8);
            for (let [ex,ey] of front) {
                p.noFill();
                p.line(ex - 2.4, ey, ex + 2.4, ey);
            }
            for (let [ex,ey] of back) {
                p.line(ex - 1.4, ey, ex + 1.4, ey);
            }
            return;
        }

        for (let [ex,ey] of front) {
            p.noStroke();
            p.fill(...WHITE, alpha);
            p.ellipse(ex, ey, 4.8, 4.8 * squash);
            p.fill(...BLACK, alpha);
            p.ellipse(ex + lookX, ey + lookY, pupilBig ? 2.8 : 1.5);
        }
        for (let [ex,ey] of back) {
            p.noStroke();
            p.fill(...WHITE, alpha * 0.75);
            p.ellipse(ex, ey, 2.8, 2.8 * squash);
            p.fill(...BLACK, alpha);
            p.ellipse(ex + lookX, ey + lookY, pupilBig ? 1.6 : 0.9);
        }

        // ── Sparkle: tiny star glints when happy/calm + relationship > 30 ──
        if (c.sparkleTimer > 0 && relationshipLevel >= 30) {
            let sparkPulse = Math.sin(c.sparkleTimer * 0.08);
            if (sparkPulse > 0.7) {
                p.noStroke();
                p.fill(255, 255, 220, alpha * sparkPulse);
                // Small cross-star on the two main front eyes
                for (let [ex,ey] of [front[1], front[2]]) {
                    let sz = 1.8 * sparkPulse;
                    p.ellipse(ex - 1.5, ey - 1.5, sz, sz);
                }
            }
        }
    }


    // ============================================================
    //  INPUT: MOUSE CLICK
    // ============================================================

    function onCanvasClick() {
        if (!micActive) startMic();
        let d = p.dist(p.mouseX, p.mouseY, creature.x, creature.y);

        if (d < CREATURE_SIZE * 0.7) {
            // Wake napping spider — becomes grumpy
            if (creature.state === "nap") {
                creature.state    = "frustrated";
                frustrationTimer  = 60 * 45;      // ~45s of grumpiness
                creature.napping  = false;
                relationshipLevel = Math.max(0, relationshipLevel - 3);
                return;
            }

            // Don't interact while eating
            if (eatingLock) return;

            // Clicked directly on spider — it flees to the furthest node from cursor
            let farNode = WEB_NODES.reduce((best, n) => {
                let nd = p.dist(n.x * p.width, n.y * p.height, p.mouseX, p.mouseY);
                let bd = p.dist(best.x * p.width, best.y * p.height, p.mouseX, p.mouseY);
                return nd > bd ? n : best;
            }, WEB_NODES[0]);

            creature.targetNode    = farNode.id;
            creature.previousNode  = creature.currentNode;
            creature.edgeT         = 0;
            creature.returningHome = false;

            travelSpeed = BASE_SPEED * 5;
            setTimeout(() => { travelSpeed = BASE_SPEED; }, 1200);

            if (relationshipLevel > 0) {
                relationshipLevel = Math.max(0, relationshipLevel - 5);
            }
            return;
        }

        // Normal feed click (not on spider)
        if (!eatingLock) creature.need = p.max(0, creature.need - CLICK_FEED);
    }


    // ============================================================
    //  MOUSE DRAG / RELEASE
    // ============================================================

    p.mousePressed = function() {
        // Dragonfly grab
        if (dragonflyImg && dragonfly.active && !dragonfly.stuck && !dragonfly.eaten && !dragonfly.dragging) {
            if (p.dist(p.mouseX, p.mouseY, dragonfly.x, dragonfly.y) < dragonfly.size * 0.7) {
                dragonfly.dragging = true;
                dragonfly.offsetX  = dragonfly.x - p.mouseX;
                dragonfly.offsetY  = dragonfly.y - p.mouseY;
                selectedDragonfly  = true;
            }
        }
        // Ladybug grab — smaller hit zone (harder to catch)
        if (ladybugImg && ladybug.active && !ladybug.stuck && !ladybug.eaten && !ladybug.dragging) {
            if (p.dist(p.mouseX, p.mouseY, ladybug.x, ladybug.y) < ladybug.size * 0.55) {
                ladybug.dragging = true;
                ladybug.offsetX  = ladybug.x - p.mouseX;
                ladybug.offsetY  = ladybug.y - p.mouseY;
                selectedLadybug  = true;
            }
        }

        for (let d of debris) {
            if (p.dist(p.mouseX, p.mouseY, d.x, d.y) < d.size) {
                selectedDebris  = d;
                d.dragging      = true;
                d.offsetX       = d.x - p.mouseX;
                d.offsetY       = d.y - p.mouseY;
                break;
            }
        }
        if (bouquetAvailable && bouquet) {
            if (p.dist(p.mouseX, p.mouseY, bouquet.x, bouquet.y) < bouquet.size / 2) {
                bouquet.dragging = true;
                bouquet.offsetX  = bouquet.x - p.mouseX;
                bouquet.offsetY  = bouquet.y - p.mouseY;
            }
        }
    };

    p.mouseDragged = function() {
        if (dragonfly.dragging) {
            dragonfly.x = p.mouseX + dragonfly.offsetX;
            dragonfly.y = p.mouseY + dragonfly.offsetY;
        }
        if (ladybug.dragging) {
            ladybug.x = p.mouseX + ladybug.offsetX;
            ladybug.y = p.mouseY + ladybug.offsetY;
        }
        if (bouquet && bouquet.dragging) {
            bouquet.x = p.mouseX + bouquet.offsetX;
            bouquet.y = p.mouseY + bouquet.offsetY;
        }
        if (selectedDebris && selectedDebris.dragging) {
            selectedDebris.x = p.mouseX + selectedDebris.offsetX;
            selectedDebris.y = p.mouseY + selectedDebris.offsetY;
        }
    };

    p.mouseReleased = function() {
        // Dragonfly release — snap to nearest web node
        if (dragonfly.dragging) {
            dragonfly.dragging = false;
            selectedDragonfly  = false;
            let snapped = false;
            for (let n of WEB_NODES) {
                let nx = n.x * p.width, ny = n.y * p.height;
                if (p.dist(dragonfly.x, dragonfly.y, nx, ny) < 55) {
                    dragonfly.stuck = true; dragonfly.stuckNode = n.id;
                    dragonfly.x = nx; dragonfly.y = ny;
                    snapped = true; break;
                }
            }
            if (!snapped) dragonfly.stuck = false;
        }

        // Ladybug release — smaller snap radius (harder)
        if (ladybug.dragging) {
            ladybug.dragging = false;
            selectedLadybug  = false;
            let snapped = false;
            for (let n of WEB_NODES) {
                let nx = n.x * p.width, ny = n.y * p.height;
                if (p.dist(ladybug.x, ladybug.y, nx, ny) < 35) {
                    ladybug.stuck = true; ladybug.stuckNode = n.id;
                    ladybug.x = nx; ladybug.y = ny;
                    snapped = true; break;
                }
            }
            if (!snapped) ladybug.stuck = false;
        }

// Bouquet drop
if (bouquet && bouquet.dragging) {
    bouquet.dragging = false;
    let d = p.dist(bouquet.x, bouquet.y, creature.x, creature.y);

    if (d < CREATURE_SIZE * 1.2 && creature.trustLevel >= 0.3) {

        // Calm + relationship boost: bouquet = +5 relationship points
        creature.state = "comfort";
        creature.trustLevel = Math.min(1, creature.trustLevel + 0.4);
        relationshipLevel = Math.min(100, relationshipLevel + 5);
        fearLevel = Math.max(0, fearLevel - 0.5);
        frustrationTimer = 0;

        // Celebration circles + web drawing
        creature.orbitAngle = 0;
        creature.celebrateTimer = 300;
        startWebFade();

        // Remove bouquet AND reset debris counters so 10 more are needed
        bouquetAvailable = false;
        bouquet          = null;
        debris1Count     = 0;
        debris2Count     = 0;
    }
}


        // Debris drop into envelope
        if (selectedDebris) {
            let b = envelopeBounds;
            if (
                selectedDebris.x > b.x && selectedDebris.x < b.x + b.w &&
                selectedDebris.y > b.y && selectedDebris.y < b.y + b.h
            ) {
                debris = debris.filter(d => d !== selectedDebris);
                envelopeBounce = 1;
                if (selectedDebris.img === debrisImg1) debris1Count++;
                if (selectedDebris.img === debrisImg2) debris2Count++;

                // +1 relationship for actively cleaning debris once trust is established
                if (creature.trustLevel >= 1) {
                    relationshipLevel = Math.min(100, relationshipLevel + 1);
                }

                if (debris1Count + debris2Count >= 10 && !bouquetAvailable) {
                    bouquetAvailable = true;
                    bouquet = {
                        x:        b.x + b.w / 2,
                        y:        b.y - 40,
                        size:     90,
                        dragging: false,
                        offsetX:  0,
                        offsetY:  0,
                    };
                }
            }
            selectedDebris.dragging = false;
            selectedDebris          = null;
        }
    };


    // ============================================================
    //  MICROPHONE
    // ============================================================

    async function startMic() {
        try {
            let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            let ctx    = new (window.AudioContext || window.webkitAudioContext)();
            let source = ctx.createMediaStreamSource(stream);
            micAnalyser = ctx.createAnalyser();
            micAnalyser.fftSize = 256;
            source.connect(micAnalyser);
            micData   = new Uint8Array(micAnalyser.frequencyBinCount);
            micActive = true;
        } catch(e) { console.log('Mic unavailable:', e); }
    }

    function getMicLevel() {
        if (!micAnalyser) return 0;
        micAnalyser.getByteFrequencyData(micData);
        let sum = 0;
        for (let i = 0; i < micData.length; i++) sum += micData[i];
        return sum / (micData.length * 255);
    }

    function updateMic(c) {
        if (!micActive) return;
        c.micLevel = getMicLevel();
        let now = Date.now();

        if (c.micLevel > MIC_THRESHOLD) {
            // Wake napping spider with grumpiness
            if (c.state === "nap") {
                c.state          = "frustrated";
                frustrationTimer = 60 * 45;
                c.napping        = false;
                relationshipLevel = Math.max(0, relationshipLevel - 3);
            }

            // Existing frustration logic
            loudEvents.push(now);
            loudEvents = loudEvents.filter(t => now - t < 60000);
            if (loudEvents.length >= 3) { frustrationTimer = 60 * 60; loudEvents = []; }
            if (c.micLevel * 100 > 50) fearLevel = Math.min(1, fearLevel + 0.25); // raises fast enough to trigger fear shake
            c.freezeTimer   = 120;
            c.returningHome = true;

            // ── Continuous loud penalty (20 seconds straight) ──
            if (loudStartTime === null) loudStartTime = now;
            if (now - loudStartTime >= 20000 && now - lastLoudPenalty > 25000) {
                if (c.micLevel * 100 > 20) {  // only if meter is above 20
                    relationshipLevel = Math.max(0, relationshipLevel - 10);
                    lastLoudPenalty   = now;
                }
            }

            // ── Burst penalty: 5+ loud events in 1 min above 20 on meter ──
            if (c.micLevel * 100 > 20) {
                loudBurstEvents.push(now);
                loudBurstEvents = loudBurstEvents.filter(t => now - t < 60000);
                if (loudBurstEvents.length >= 5 && now - lastLoudPenalty > 15000) {
                    relationshipLevel = Math.max(0, relationshipLevel - 10);
                    lastLoudPenalty   = now;
                    loudBurstEvents   = [];
                }
            }
        } else {
            // Reset continuous streak when quiet
            loudStartTime = null;
        }
    }


    // ============================================================
    //  PERSISTENCE
    // ============================================================

    function saveState(c) {
        try {
            localStorage.setItem('creature_v2', JSON.stringify({
                need: c.need, lastVisit: Date.now(), totalVisits: c.totalVisits,
                relationshipLevel: relationshipLevel,
            }));
        } catch(e) {}
    }

    function loadState(c) {
        try {
            let raw = localStorage.getItem('creature_v2');
            if (!raw) { c.totalVisits = 1; return; }
            let data = JSON.parse(raw);
            c.need        = data.need        || 50;
            c.totalVisits = (data.totalVisits || 0) + 1;
            c.lastVisit   = data.lastVisit   || null;

            // Restore relationship, then award +2 for returning (capped at 100)
            relationshipLevel = data.relationshipLevel || 0;
            relationshipLevel = Math.min(100, relationshipLevel + 2);

            // FIX: guard against null lastVisit before using it
            if (c.lastVisit) {
                let hours = Math.min((Date.now() - c.lastVisit) / 3600000, AFK_MAX_HOURS);
                c.need           = Math.min(c.need + hours * AFK_PER_HOUR, 100);
                c.trustBuildRate = 0.001 / (1 + hours * 0.15);
                c.awayTooLong    = hours >= 1;
            }
        } catch(e) {
            c.totalVisits = 1;
        }
    }


    // ============================================================
    //  SIDEBAR SYNC
    // ============================================================

    // FIX: colorFor moved outside updateSidebar so it is a proper named function
    function colorFor(value) {
        if (value < 0.33) return "#66dd88";
        if (value < 0.66) return "#ffaa00";
        return "#ff4444";
    }

    function updateSidebar(c) {
        // Icon value labels (in state card)
        let relVal = document.getElementById("ui-relationship-val");
        if (relVal) relVal.textContent = Math.floor(relationshipLevel);

        let fearVal = document.getElementById("ui-fear-val");
        if (fearVal) fearVal.textContent = Math.floor(fearLevel * 100);

        let noiseVal = document.getElementById("ui-noise-val");
        if (noiseVal) noiseVal.textContent = Math.floor(c.micLevel * 100);

        // Bar colours
        let relBar   = document.getElementById("ui-relationship-bar");
        let fearBar  = document.getElementById("ui-fear-bar");
        let noiseBar = document.getElementById("ui-noise-bar");
        if (relBar)   { relBar.style.width   = relationshipLevel + "%"; relBar.style.background   = colorFor(relationshipLevel / 100); }
        if (fearBar)  { fearBar.style.width  = (fearLevel * 100)         + "%"; fearBar.style.background  = colorFor(fearLevel);         }
        if (noiseBar) { noiseBar.style.width = Math.min(100, c.micLevel * 100) + "%"; noiseBar.style.background = colorFor(c.micLevel);  }

        // State label colour
        if (ui.state) {
            ui.state.style.color =
                c.state === "fear"       ? "#ff4444" :
                c.state === "frustrated" ? "#ff8844" :
                c.state === "distressed" ? "#ffaa00" :
                c.state === "worried"    ? "#ffcc00" :
                c.state === "untrusted"  ? "#cccc00" :
                c.state === "calm"       ? "#66dd88" :
                c.state === "happy"      ? "#88ff88" : "#ffffff";
        }

        if (ui.hour)    ui.hour.textContent    = c.hour % 12 || 12;
        if (ui.period)  ui.period.textContent  = c.hour < 12 ? 'am' : 'pm';
        if (ui.state)   ui.state.textContent   = c.state;
        if (ui.desc)    ui.desc.textContent    = STATE_DESCRIPTIONS[c.state] || '';
        if (ui.needVal) ui.needVal.textContent = Math.floor(c.need);
        if (ui.needBar) ui.needBar.style.width = c.need + "%";
        if (ui.visits)  ui.visits.textContent  = c.totalVisits;
        if (ui.excited) ui.excited.textContent = c.exciteTimer > 0 ? 'yes!' : 'no';
        if (ui.watched) ui.watched.textContent = c.isWatched ? 'on' : 'away';
        if (ui.mic)     ui.mic.textContent     = micActive ? c.micLevel.toFixed(2) : '—';
        if (ui.trustVal) ui.trustVal.textContent = Math.floor(c.trustLevel * 100);
        if (ui.trustBar) ui.trustBar.style.width  = (c.trustLevel * 100) + "%";

        if (ui.day) {
            const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            ui.day.textContent = days[new Date().getDay()];
        }

        if (ui.weather) {
            ui.weather.textContent = (weatherData && weatherData.current)
                ? describeWeather(weatherData.current.weather_code)
                : "loading…";
        }

        let uiEnv = document.getElementById("ui-envelope-count");
        if (uiEnv) uiEnv.textContent = debris1Count + debris2Count;

        let connBar = document.getElementById("ui-connection-bar");
        if (connBar) connBar.style.width = (connectionLevel * 100) + "%";
        let connVal = document.getElementById("ui-connection-val");
        if (connVal) connVal.textContent = Math.floor(connectionLevel * 100);

        let relDisplay = document.getElementById("ui-relationship-display");
        if (relDisplay) relDisplay.textContent = Math.floor(relationshipLevel);

        // Time away
        if (ui.away) {
            focusAwayMinutes = focusLostAt ? Math.floor((Date.now() - focusLostAt) / 60000) : 0;
            ui.away.textContent = focusAwayMinutes + "m";
        }

        // AFK counter
        if (ui.afk && c.lastVisit) {
            ui.afk.textContent = Math.floor((Date.now() - c.lastVisit) / 60000) + "m";
        }
    }


    // ============================================================
    //  UTILITY
    // ============================================================

    function drawImageNoStretch(img) {
        if (!img) return;
        let imgRatio    = img.width / img.height;
        let canvasRatio = p.width   / p.height;
        let drawW, drawH;
        if (imgRatio > canvasRatio) { drawH = p.height; drawW = drawH * imgRatio; }
        else                        { drawW = p.width;  drawH = drawW / imgRatio; }
        p.image(img, (p.width - drawW) / 2, (p.height - drawH) / 2, drawW, drawH);
    }


    // ============================================================
    //  WINDOW RESIZE
    // ============================================================

    p.windowResized = function() {
        let sz = canvasSize();
        p.resizeCanvas(sz.w, sz.h);
    };


    // ============================================================
    //  SIDEBAR CONTROLS
    // ============================================================

    window._resetNeed         = () => { if (creature) creature.need = 0; };
    window._maxNeed           = () => { if (creature) creature.need = 100; };
    window._setDecay          = v  => { DECAY_RATE = v; };
    window._setFeed           = v  => { CLICK_FEED = v; };
    window._resetRelationship = () => { relationshipLevel = 0; };

}, document.body);