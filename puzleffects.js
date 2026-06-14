// const NOISE_BG_COUNT = 2;
// let noiseIndex = 0;

// setInterval(function() {
//     noiseIndex++;
//     if (noiseIndex >= NOISE_BG_COUNT) {
//         noiseIndex = 0;
//     }
//     const noiseUrl = "url(\"noise" + (noiseIndex + 1) + ".png\")";
//     document.documentElement.style.backgroundImage = noiseUrl;
// }, 100)

function newJum() {
    return {
        element: undefined,
        jumX: 0,
        jumY: 0,
        jumRot: 0,
        jumSpeed: 0,
        jumDir: 0,
        jumRotSpeed: 0,
        jumPrevTime: undefined,
    }
}

let jum = undefined;
let jumX = 0;
let jumY = 0;
let jumRot = 0;
let jumSpeed = 0;
let jumDir = 0;
let jumRotSpeed = 0;
let jumPrevTime = undefined;

const JUM_DIAMETER = 64;
const JUM_FRICTION = 0.65;
const JUM_ROT_FRICTION = 0.4;

const VOICE_ROTATION = [
    "hotchocolate.mp3",
    "cawfee.mp3",
    "mocha.mp3",
    "hontcholclate.mp3",
    "smoothie.mp3",
    "tea.mp3",
    "bobatea.mp3",
    "sweettea.mp3",
    "coffee.mp3",
    "jeuice.mp3",
    "javachipfrappuccino.mp3",
    "milk.mp3",
    "eggnog.mp3",
    "wine.mp3",
    "wawter.mp3",
    "lemonade.mp3",
    "gingerale.mp3",
    "rootbeer.mp3",
    "creamycreamsoda.mp3",
    "energydrink.mp3",
    "beer.mp3",
    "water.mp3",
    "yapplecider.mp3",
    "horchata.mp3",
    "koolaid.mp3",
    "champagne.mp3",
    "icecream.mp3",
    "pee.mp3",
    "choccymilkies.mp3",
    "kombucha.mp3",
    "sauce.mp3",
    "blood.mp3",
    // "bucketofmilk.mp3",
    "aliennoises.mp3",
    "limestone.mp3",
    "flavoredsparklingwater.mp3",
    "liquidhelium.mp3",
    "nyquil.mp3",
];
let voiceIndex = 0;

// Hold to charge
// Change volume with hold
// loading circle while loading audio

document.getElementById("jum").addEventListener("click", function (e) {
    if (!jum) {
        jum = e.target;
        jum.style.position = "fixed";
        const rect = jum.getBoundingClientRect();
        jumX = rect.x;
        jumY = rect.y;
        jum.style.left = jumX + "px";
        jum.style.top = jumY + "px";
    }
    jumSpeed = Math.random() * 600 + 400;
    jumDir = Math.random() * Math.PI * 2;
    jumRotSpeed = (Math.random() * Math.PI * 2 - Math.PI) * 10;
    jumPrevTime = undefined;
    requestAnimationFrame(animateJum);

    const drinkRecommendation = new Audio("assets/sound/" + VOICE_ROTATION[voiceIndex]);
    drinkRecommendation.play();
    voiceIndex++;
    if (voiceIndex >= VOICE_ROTATION.length) {
        voiceIndex = 0;
    }
});

function animateJum(newTime) {
    if (jumPrevTime == undefined) {
        jumPrevTime = newTime;
        requestAnimationFrame(animateJum);
        return;
    }

    const delta = (newTime - jumPrevTime) / 1000;

    jumX += Math.cos(jumDir) * jumSpeed * delta;
    jumY += Math.sin(jumDir) * jumSpeed * delta;
    jumRot += jumRotSpeed * delta;

    // Last night took a L, but tonight I
    bounceBack();

    jum.style.left = jumX + "px";
    jum.style.top = jumY + "px";
    jum.style.rotate = jumRot + "rad";

    jumSpeed *= Math.pow(1 - JUM_FRICTION, delta);
    jumRotSpeed *= Math.pow(1 - JUM_ROT_FRICTION, delta);

    jumPrevTime = newTime;

    if (jumSpeed <= 10) {
        jumSpeed = 0;
    }
    if (Math.abs(jumRotSpeed) < Math.PI / 15) {
        jumRotSpeed = 0;
    }
    if (jumSpeed !== 0 || jumRotSpeed !== 0) {
        requestAnimationFrame(animateJum);
    }
}

function bounceBack() {
    if (jumX < 0) {
        jumX = -jumX;
        jumDir = Math.PI - jumDir;
    }
    if (jumX > window.innerWidth - JUM_DIAMETER) {
        jumX = 2 * (window.innerWidth - JUM_DIAMETER) - jumX;
        jumDir = Math.PI - jumDir;
    }
    if (jumY < 0) {
        jumY = -jumY;
        jumDir = -jumDir;
    }
    if (jumY > window.innerHeight - JUM_DIAMETER) {
        jumY = 2 * (window.innerHeight - JUM_DIAMETER) - jumY;
        jumDir = -jumDir;
    }
}
