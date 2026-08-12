// const NOISE_BG_COUNT = 2;
// let noiseIndex = 0;

// //This ended up being way too CPU-intensive, although it looks really cool

// setInterval(function() {
//     noiseIndex++;
//     if (noiseIndex >= NOISE_BG_COUNT) {
//         noiseIndex = 0;
//     }
//     const noiseUrl = "url(\"assets/noise" + (noiseIndex + 1) + ".png\") repeat";
//     document.getElementById("bg1").style.background = noiseUrl;
//     document.getElementById("bg2").style.background = noiseUrl;
// }, 100)

document.querySelectorAll(".spoiler").forEach(function(element) {
    element.addEventListener("click", function(e) {
        e.target.style.backgroundColor = "var(--color-neutral-weak)";
    });
});

// TODO: remove globals
// function newJum() {
//     return {
//         element: undefined,
//         jumX: 0,
//         jumY: 0,
//         jumRot: 0,
//         jumSpeed: 0,
//         jumDir: 0,
//         jumRotSpeed: 0,
//         jumPrevTime: undefined,
//     }
// }

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

// TODO:
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

    const drinkRecommendation = new Audio("/assets/sound/" + VOICE_ROTATION[voiceIndex]);
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

// Change image gallery from direct links to images to a popup image viewer
document.querySelectorAll(".image-gallery").forEach(function(gallery) {
    const links = Array.from(gallery.querySelectorAll("a[href]"));
    if (!links.length) {
        return;
    }

    const lightbox = document.createElement("div");
    lightbox.className = "gallery-lightbox";
    lightbox.setAttribute("aria-hidden", "true");

    const dialog = document.createElement("div");
    dialog.className = "gallery-lightbox__dialog";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "gallery-lightbox__close";
    closeButton.setAttribute("aria-label", "Close image viewer");
    closeButton.textContent = "×";

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "gallery-lightbox__nav gallery-lightbox__prev";
    prevButton.setAttribute("aria-label", "Previous image");
    prevButton.textContent = "‹";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "gallery-lightbox__nav gallery-lightbox__next";
    nextButton.setAttribute("aria-label", "Next image");
    nextButton.textContent = "›";

    const number = document.createElement("span");
    number.className = "gallery-lightbox__number";

    const image = document.createElement("img");
    image.className = "gallery-lightbox__image";
    image.alt = "Gallery image";

    const caption = document.createElement("figcaption");
    caption.className = "gallery-lightbox__caption";
    
    lightbox.appendChild(closeButton);
    lightbox.appendChild(prevButton);
    lightbox.appendChild(nextButton);

    dialog.appendChild(number);
    dialog.appendChild(image);
    dialog.appendChild(caption);
    lightbox.appendChild(dialog);
    document.body.appendChild(lightbox);

    let currentIndex = 0;
    let pendingLoadToken = 0;

    function estimateAspectRatio(link) {
        const thumb = link.querySelector("img");
        if (!thumb) {
            return 4 / 3;
        }

        if (thumb.naturalWidth > 0 && thumb.naturalHeight > 0) {
            return thumb.naturalWidth / thumb.naturalHeight;
        }

        if (thumb.width > 0 && thumb.height > 0) {
            return thumb.width / thumb.height;
        }

        return 4 / 3;
    }

    function applyPlaceholderSize(aspectRatio) {
        const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 4 / 3;
        const availableWidth = Math.max(window.innerWidth - 220, 220);
        const availableHeight = Math.max(window.innerHeight - 220, 180);

        let width = Math.min(availableWidth, availableHeight * safeAspectRatio);
        let height = width / safeAspectRatio;

        if (height > availableHeight) {
            height = availableHeight;
            width = height * safeAspectRatio;
        }

        width = Math.max(width, 220);
        height = Math.max(height, 180);

        lightbox.style.setProperty("--lightbox-placeholder-width", `${Math.round(width)}px`);
        lightbox.style.setProperty("--lightbox-placeholder-height", `${Math.round(height)}px`);
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        dialog.classList.remove("is-loading");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function updateLightbox(index) {
        const link = links[index];
        if (!link) {
            return;
        }

        const fullSrc = link.dataset.fullSrc || link.getAttribute("href");
        const figure = link.closest("figure");
        const text = figure ? figure.querySelector("figcaption")?.textContent?.trim() : "";

        const estimatedRatio = estimateAspectRatio(link);
        const loadToken = ++pendingLoadToken;

        currentIndex = index;
        applyPlaceholderSize(estimatedRatio);
        dialog.classList.add("is-loading");
        image.alt = link.querySelector("img")?.alt || "Gallery image";
        caption.textContent = text || "";
        caption.hidden = !text;
        number.textContent = `${index + 1} of ${ links.length}`;

        image.onload = function() {
            if (loadToken !== pendingLoadToken) {
                return;
            }

            dialog.classList.remove("is-loading");
        };

        image.onerror = function() {
            if (loadToken !== pendingLoadToken) {
                return;
            }

            dialog.classList.remove("is-loading");
            caption.textContent = "Unable to load image.";
            caption.hidden = false;
        };

        image.src = fullSrc;

        if (index === 0) {
            prevButton.classList.add("disabled");
        } else {
            prevButton.classList.remove("disabled");
        }
        if (index === links.length - 1) {
            nextButton.classList.add("disabled");
        } else {
            nextButton.classList.remove("disabled");
        }
    }

    function showLightbox(index) {
        if (index < 0) {
            index = 0;
        }
        if (index >= links.length) {
            index = links.length - 1;
        }

        updateLightbox(index);
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    links.forEach(function(link, index) {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            showLightbox(index);
        });
    });

    prevButton.addEventListener("click", function() {
        showLightbox(currentIndex - 1);
    });

    nextButton.addEventListener("click", function() {
        showLightbox(currentIndex + 1);
    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function(event) {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", function(event) {
        if (!lightbox.classList.contains("is-open")) {
            return;
        }

        if (event.key === "Escape") {
            closeLightbox();
        } else if (event.key === "ArrowRight") {
            showLightbox(currentIndex + 1);
        } else if (event.key === "ArrowLeft") {
            showLightbox(currentIndex - 1);
        }
    });
});
