(function () {
    "use strict";

    const loaderHTML = `
        <div id="toucan-global-loader">
            <div class="loader">
                <div class="loading-text">
                    Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </div>

                <div class="loading-bar-background">
                    <div class="loading-bar">
                        <div class="white-bars-container">
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                            <div class="white-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const loaderCSS = `
        #toucan-global-loader {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
            opacity: 1;
            visibility: visible;
            transition: opacity 0.35s ease, visibility 0.35s ease;
        }

        #toucan-global-loader.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        #toucan-global-loader .loader {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 5px;
        }

        #toucan-global-loader .loading-text {
            color: white;
            font-size: 14pt;
            font-weight: 600;
            margin-left: 10px;
        }

        #toucan-global-loader .dot {
            margin-left: 3px;
            animation: toucanBlink 1.5s infinite;
        }

        #toucan-global-loader .dot:nth-child(2) {
            animation-delay: 0.3s;
        }

        #toucan-global-loader .dot:nth-child(3) {
            animation-delay: 0.6s;
        }

        #toucan-global-loader .loading-bar-background {
            --height: 30px;
            display: flex;
            align-items: center;
            box-sizing: border-box;
            padding: 5px;
            width: 200px;
            height: var(--height);
            background-color: #212121;
            box-shadow: #0c0c0c -2px 2px 4px 0px inset;
            border-radius: calc(var(--height) / 2);
        }

        #toucan-global-loader .loading-bar {
            position: relative;
            display: flex;
            justify-content: center;
            flex-direction: column;
            --height: 20px;
            width: 0%;
            height: var(--height);
            overflow: hidden;
            background: linear-gradient(
                0deg,
                rgba(222, 74, 15, 1) 0%,
                rgba(249, 199, 79, 1) 100%
            );
            border-radius: calc(var(--height) / 2);
            animation: toucanLoading 4s ease-out infinite;
        }

        #toucan-global-loader .white-bars-container {
            position: absolute;
            display: flex;
            align-items: center;
            gap: 18px;
        }

        #toucan-global-loader .white-bar {
            background: linear-gradient(
                -45deg,
                rgba(255, 255, 255, 1) 0%,
                rgba(255, 255, 255, 0) 70%
            );
            width: 10px;
            height: 45px;
            opacity: 0.3;
            rotate: 45deg;
        }

        @keyframes toucanLoading {
            0% {
                width: 0;
            }

            80% {
                width: 100%;
            }

            100% {
                width: 100%;
            }
        }

        @keyframes toucanBlink {
            0%, 100% {
                opacity: 0;
            }

            50% {
                opacity: 1;
            }
        }
    `;

    function createLoader() {
        if (document.getElementById("toucan-global-loader")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "toucan-loader-styles";
        style.textContent = loaderCSS;
        document.head.appendChild(style);

        document.body.insertAdjacentHTML("afterbegin", loaderHTML);
    }

    function show() {
        createLoader();

        const loader = document.getElementById("toucan-global-loader");

        if (loader) {
            loader.classList.remove("hidden");
        }
    }

    function hide() {
        const loader = document.getElementById("toucan-global-loader");

        if (!loader) {
            return;
        }

        loader.classList.add("hidden");

        setTimeout(() => {
            loader.remove();
        }, 400);
    }

    window.ToucanLoader = {
        show,
        hide
    };

    // Show automatically as soon as the page starts.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", show);
    } else {
        show();
    }
})();