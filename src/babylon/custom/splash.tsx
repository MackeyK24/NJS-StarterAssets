'use client';

import { useEffect, useRef, useState } from "react";
import GameManager from "../globals";
import "./splash.css";

type AssetProgressMessage = {
  assetName?: string;
  fileName?: string;
  rootPath?: string;
  sceneFile?: string;
  loadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  aggregateLoadedBytes?: number;
  aggregateTotalBytes?: number;
  aggregatePercent?: number;
  completedAssets?: number;
  totalAssets?: number;
  overallPercent?: number;
  dependencyUrl?: string;
  message?: string;
};

function SplashScreen() {
  const logoSrc = "https://cdn.babylonjs.com/Assets/babylonLogo.png";
  const spinnerSrc = "https://cdn.babylonjs.com/Assets/loadingIcon.png";
  const [statusText, setStatusText] = useState<string>("Loading...");
  const loadingFinishedRef = useRef<boolean>(false);

  useEffect(() => {
    const formatLoadingText = (completed: number, total: number): string => {
      if (total > 0) {
        const current = Math.min(completed + 1, total);
        return `Loading ${current} of ${total}`;
      }
      return "Loading...";
    };

    const formatLoadCompleteText = (completed: number, total: number): string => {
      if (total > 0) {
        const finalCount = Math.max(Math.min(completed, total), total);
        return `Loading ${finalCount} of ${total}`;
      }
      return "Loading...";
    };

    const onLoadProgress = (data: AssetProgressMessage) => {
      const completed = data.completedAssets ?? 0;
      const total = data.totalAssets ?? 0;
      loadingFinishedRef.current = false;
      setStatusText(formatLoadingText(completed, total));
    };

    const onLoadComplete = (data: AssetProgressMessage) => {
      const completed = data.completedAssets ?? 0;
      const total = data.totalAssets ?? 0;
      loadingFinishedRef.current = true;
      setStatusText(formatLoadCompleteText(completed, total));
    };

    const onSceneReady = (data: AssetProgressMessage) => {
      setStatusText("Please wait");
    };

    GameManager.EventBus.OnMessage<AssetProgressMessage>("OnLoadProgress", onLoadProgress);
    GameManager.EventBus.OnMessage<AssetProgressMessage>("OnLoadComplete", onLoadComplete);
    GameManager.EventBus.OnMessage<AssetProgressMessage>("OnSceneReady", onSceneReady);

    return () => {
      GameManager.EventBus.RemoveHandler("OnLoadProgress", onLoadProgress);
      GameManager.EventBus.RemoveHandler("OnLoadComplete", onLoadComplete);
      GameManager.EventBus.RemoveHandler("OnSceneReady", onSceneReady);
    };
  }, []);

  return (
    <div className="splash" id="xbabylonjsSplashScreen">
      <div
        id="xbabylonjsLoadingDiv"
        style={{
          backgroundColor: "#2A2342",
          pointerEvents: "none",
          display: "grid",
          gridTemplateRows: "100%",
          gridTemplateColumns: "100%",
          justifyItems: "center",
          alignItems: "center",
          zIndex: 10001,
          position: "absolute",
          inset: 0,
        }}
      >
        <div
          id="xbabylonjsStatusTextDiv"
          style={{
            position: "absolute",
            right: "18px",
            bottom: "12px",
            fontFamily: "Arial",
            fontSize: "12px",
            color: "white",
            textAlign: "right",
            zIndex: 2,
            opacity: 0.9,
            letterSpacing: "0.3px",
          }}
        >
         {statusText}
        </div>
        <div
          id="xbabylonjsLoadingTextDiv"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            marginTop: "80px",
            width: "100%",
            height: "20px",
            fontFamily: "Arial",
            fontSize: "14px",
            color: "white",
            textAlign: "center",
            zIndex: 1,
          }}
        />
        <img
          id="xbabylonjsLoadingImage"
          src={logoSrc}
          alt="Babylon loading logo"
          style={{
            width: "150px",
            gridColumn: 1,
            gridRow: 1,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "absolute",
          }}
        />
        <div
          style={{
            width: "320px",
            height: "320px",
            gridColumn: 1,
            gridRow: 1,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            position: "absolute",
            display: "grid",
            placeItems: "center",
          }}
        >
          <img
            id="xbabylonjsLoadingSpinner"
            src={spinnerSrc}
            alt="Babylon loading spinner"
            style={{
              width: "320px",
              height: "320px",
              animation: "spin1 0.75s infinite linear",
              transformOrigin: "50% 50%",
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SplashScreen;