"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

const GRID_SIZE = 8;
const BOMB_PRICE = 50;
const ROCKET_PRICE = 100;
const CLEAR_ALL_PRICE = 250; // 5x harga bom
const AD_URL = "https://www.profitableratecpmnetwork.com/d54r2im9d1?key=868277df5dda70748cfda6df9c066856";
const AD_WAIT_MS = 8000; // minimal waktu tunggu sebelum hadiah iklan bisa diklaim
const START_COINS = 100;
const COINS_PER_LINE = 10;

const SHAPES = [
  { matrix: [[1]], color: 1 },
  { matrix: [[1, 1]], color: 2 },
  { matrix: [[1], [1]], color: 2 },
  { matrix: [[1, 1, 1]], color: 3 },
  { matrix: [[1], [1], [1]], color: 3 },
  { matrix: [[1, 1], [1, 1]], color: 4 },
  { matrix: [[1, 1, 1], [0, 1, 0]], color: 5 },
  { matrix: [[1, 0], [1, 0], [1, 1]], color: 6 },
  { matrix: [[1, 1], [0, 1], [0, 1]], color: 1 },
];

const playSound = (type) => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    switch (type) {
      case "pickup":
        const pickOsc = ctx.createOscillator();
        const pickGain = ctx.createGain();
        pickOsc.type = "sine";
        pickOsc.frequency.setValueAtTime(350, now);
        pickOsc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
        pickGain.gain.setValueAtTime(0.12, now);
        pickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        pickOsc.connect(pickGain);
        pickGain.connect(ctx.destination);
        pickOsc.start(now);
        pickOsc.stop(now + 0.06);
        break;

      case "place":
        const placeOsc = ctx.createOscillator();
        const placeGain = ctx.createGain();
        placeOsc.type = "triangle";
        placeOsc.frequency.setValueAtTime(280, now);
        placeOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        placeGain.gain.setValueAtTime(0.3, now);
        placeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        placeOsc.connect(placeGain);
        placeGain.connect(ctx.destination);
        placeOsc.start(now);
        placeOsc.stop(now + 0.08);
        break;

      case "blast":
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + index * 0.04);
          gain.gain.setValueAtTime(0.15, now + index * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.04 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.04);
          osc.stop(now + index * 0.04 + 0.15);
        });
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(160, now);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.25);
        break;

      case "bomb":
        const bombOsc = ctx.createOscillator();
        const bombGain = ctx.createGain();
        bombOsc.type = "sawtooth";
        bombOsc.frequency.setValueAtTime(200, now);
        bombOsc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        bombGain.gain.setValueAtTime(0.45, now);
        bombGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        bombOsc.connect(bombGain);
        bombGain.connect(ctx.destination);
        bombOsc.start(now);
        bombOsc.stop(now + 0.35);
        break;

      case "coin":
        const coinNotes = [880, 1174.66];
        coinNotes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + index * 0.06);
          gain.gain.setValueAtTime(0.08, now + index * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.06);
          osc.stop(now + index * 0.06 + 0.12);
        });
        break;

      case "gameover":
        const goNotes = [440, 392, 349, 261];
        goNotes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, now + index * 0.1);
          gain.gain.setValueAtTime(0.15, now + index * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + index * 0.1);
          osc.stop(now + index * 0.1 + 0.25);
        });
        break;

      case "click":
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = "sine";
        clickOsc.frequency.setValueAtTime(600, now);
        clickOsc.frequency.setValueAtTime(900, now + 0.02);
        clickGain.gain.setValueAtTime(0.1, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.04);
        break;
    }
  } catch (e) {
    console.log("Audio API error:", e);
  }
};

export default function BlockBlastGame() {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [poolBlocks, setPoolBlocks] = useState([null, null, null]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [blastingCells, setBlastingCells] = useState([]);

  const [coins, setCoins] = useState(START_COINS);
  const [bombs, setBombs] = useState(1);
  const [rockets, setRockets] = useState(1);
  const [bombMode, setBombMode] = useState(false);
  const [rocketMode, setRocketMode] = useState(false);
  const [shopItem, setShopItem] = useState(null);
  const [adTask, setAdTask] = useState(null);

  const [drag, setDrag] = useState({
    active: false,
    block: null,
    slotIndex: null,
    x: 0,
    y: 0,
    targetRow: null,
    targetCol: null,
    isValid: false,
  });

  const gridRef = useRef(null);

  // --- INITIAL LOAD EFFECT ---
  useEffect(() => {
    const savedHigh = localStorage.getItem("block_q_high");
    if (savedHigh) setHighScore(parseInt(savedHigh, 10));

    const savedCoins = localStorage.getItem("block_q_coins");
    if (savedCoins !== null) setCoins(parseInt(savedCoins, 10));

    const savedBombs = localStorage.getItem("block_q_bombs");
    if (savedBombs !== null) setBombs(parseInt(savedBombs, 10));

    const savedRockets = localStorage.getItem("block_q_rockets");
    if (savedRockets !== null) setRockets(parseInt(savedRockets, 10));

    spawnPoolBlocks();
  }, []);

  // --- GAME OVER EFFECT ---
  useEffect(() => {
    if (isGameOver && score > 0) {
      playSound("gameover");

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("block_q_high", score.toString());
      }
    }
  }, [isGameOver, score, highScore]);

  // --- IKLAN: aktifkan tombol klaim setelah menunggu sebentar ---
  useEffect(() => {
    if (!adTask || !adTask.opened || adTask.ready) return;
    const timer = setTimeout(() => {
      setAdTask((prev) => (prev ? { ...prev, ready: true } : prev));
    }, AD_WAIT_MS);
    return () => clearTimeout(timer);
  }, [adTask]);

  const spawnPoolBlocks = () => {
    const newBlocks = Array(3).fill(null).map(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setPoolBlocks(newBlocks);
  };

  const canPlaceBlock = (currentGrid, matrix, startRow, startCol) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[0].length; c++) {
        if (matrix[r][c] === 1) {
          const gridR = startRow + r;
          const gridC = startCol + c;
          if (gridR < 0 || gridR >= GRID_SIZE || gridC < 0 || gridC >= GRID_SIZE) return false;
          if (currentGrid[gridR][gridC] !== 0) return false;
        }
      }
    }
    return true;
  };

  // --- POINTER DOWN (DETEKSI SENTUHAN AWAL) ---
  const handlePointerDown = (e, index, block) => {
    if (!block || bombMode || rocketMode) return;
    playSound("pickup");

    // Jika di HP/Touch naik 90px agar tidak tertutup jari, jika PC/Mouse cukup naik 40px
    const offsetY = e.pointerType === "touch" ? 90 : 40;

    setDrag({
      active: true,
      block,
      slotIndex: index,
      x: e.clientX,
      y: e.clientY - offsetY,
      targetRow: null,
      targetCol: null,
      isValid: false,
    });
  };

  // --- POINTER MOVE & UP LISTENERS ---
  useEffect(() => {
    if (!drag.active) return;

    const handlePointerMove = (e) => {
      let targetRow = null;
      let targetCol = null;
      let isValid = false;

      // Dinamis offset berdasarkan device aktif saat menyeret balok
      const offsetY = e.pointerType === "touch" ? 90 : 40;

      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const cellSize = rect.width / GRID_SIZE;
        const logicalX = e.clientX - rect.left;
        const logicalY = (e.clientY - offsetY) - rect.top;

        targetCol = Math.floor(logicalX / cellSize) - Math.floor(drag.block.matrix[0].length / 2);
        targetRow = Math.floor(logicalY / cellSize) - Math.floor(drag.block.matrix.length / 2);

        isValid = canPlaceBlock(grid, drag.block.matrix, targetRow, targetCol);
      }

      setDrag((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY - offsetY,
        targetRow,
        targetCol,
        isValid,
      }));
    };

    const handlePointerUp = () => {
      if (drag.isValid && drag.targetRow !== null && drag.targetCol !== null) {
        placeBlockAndProcess(drag.block, drag.targetRow, drag.targetCol, drag.slotIndex);
      }
      setDrag({ active: false, block: null, slotIndex: null, x: 0, y: 0, targetRow: null, targetCol: null, isValid: false });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag.active, drag.block, drag.isValid, drag.targetRow, drag.targetCol, grid]);

  const placeBlockAndProcess = (block, startRow, startCol, slotIndex) => {
    let newGrid = grid.map((row) => [...row]);
    let blockScore = 0;

    for (let r = 0; r < block.matrix.length; r++) {
      for (let c = 0; c < block.matrix[0].length; c++) {
        if (block.matrix[r][c] === 1) {
          newGrid[startRow + r][startCol + c] = block.color;
          blockScore += 10;
        }
      }
    }

    const newPool = [...poolBlocks];
    newPool[slotIndex] = null;
    setPoolBlocks(newPool);

    updateScore(blockScore);
    checkLines(newGrid, newPool);
  };

  const addCoins = (amount) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem("block_q_coins", next.toString());
      return next;
    });
  };

  const checkLines = (currentGrid, currentPool) => {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < GRID_SIZE; r++) if (currentGrid[r].every((val) => val > 0)) rowsToClear.push(r);
    for (let c = 0; c < GRID_SIZE; c++) {
      let colFull = true;
      for (let r = 0; r < GRID_SIZE; r++) if (currentGrid[r][c] === 0) colFull = false;
      if (colFull) colsToClear.push(c);
    }

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
      playSound("blast");
      const linesCleared = rowsToClear.length + colsToClear.length;
      updateScore(linesCleared * 100);
      addCoins(linesCleared * COINS_PER_LINE);

      let blastCoords = [];
      rowsToClear.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) { blastCoords.push(`${r}-${c}`); currentGrid[r][c] = 0; }
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) { blastCoords.push(`${r}-${c}`); currentGrid[r][c] = 0; }
      });

      setBlastingCells(blastCoords);
      setTimeout(() => setBlastingCells([]), 300);
    } else {
      playSound("place");
    }

    setGrid(currentGrid);

    if (currentPool.every((b) => b === null)) {
      const newBlocks = Array(3).fill(null).map(() => SHAPES[Math.floor(Math.random() * SHAPES.length)]);
      setPoolBlocks(newBlocks);
      setTimeout(() => checkGameOverCondition(currentGrid, newBlocks), 100);
    } else {
      checkGameOverCondition(currentGrid, currentPool);
    }
  };

  const updateScore = (points) => {
    setScore((prev) => prev + points);
  };

  // --- BOMB, ROCKET & SHOP ---
  const blastCells = (coords) => {
    if (coords.length === 0) return;
    setBlastingCells(coords);
    setTimeout(() => setBlastingCells([]), 300);
  };

  const changeBombs = (amount) =>
    setBombs((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem("block_q_bombs", next.toString());
      return next;
    });

  const changeRockets = (amount) =>
    setRockets((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem("block_q_rockets", next.toString());
      return next;
    });

  const itemPrice = (item) =>
    item === "bomb" ? BOMB_PRICE : item === "rocket" ? ROCKET_PRICE : CLEAR_ALL_PRICE;

  const itemAds = (item) => (item === "clearall" ? 2 : 1);

  const activateBomb = () => {
    if (isGameOver) return;
    playSound("click");
    // Bom habis -> munculkan pop up beli / tonton iklan
    if (bombs <= 0) {
      setShopItem("bomb");
      return;
    }
    setRocketMode(false);
    setBombMode((prev) => !prev);
  };

  const activateRocket = () => {
    if (isGameOver) return;
    playSound("click");
    if (rockets <= 0) {
      setShopItem("rocket");
      return;
    }
    setBombMode(false);
    setRocketMode((prev) => !prev);
  };

  const doClearAll = () => {
    playSound("bomb");
    const blastCoords = [];
    const newGrid = grid.map((row, r) =>
      row.map((val, c) => {
        if (val !== 0) blastCoords.push(`${r}-${c}`);
        return 0;
      })
    );

    blastCells(blastCoords);
    setGrid(newGrid);
    setBombMode(false);
    setRocketMode(false);
  };

  const buyItem = () => {
    if (!shopItem) return;
    const price = itemPrice(shopItem);
    if (coins < price) return;

    playSound("coin");
    addCoins(-price);

    if (shopItem === "bomb") {
      changeBombs(1);
      setRocketMode(false);
      setBombMode(true);
    } else if (shopItem === "rocket") {
      changeRockets(1);
      setBombMode(false);
      setRocketMode(true);
    } else {
      doClearAll();
    }
    setShopItem(null);
  };

  // --- IKLAN (rewarded ad) ---
  const startAd = (item) => {
    playSound("click");
    setShopItem(null);
    setAdTask({ kind: item, total: itemAds(item), done: 0, opened: false, ready: false });
  };

  const openAdTab = () => {
    playSound("click");
    window.open(AD_URL, "_blank", "noopener,noreferrer");
    setAdTask((prev) => (prev ? { ...prev, opened: true, ready: false } : prev));
  };

  const continueGame = () => {
    // Lanjut main: skor tetap, sebagian papan (baris atas) dibersihkan
    const keepFromRow = Math.floor(GRID_SIZE / 2);
    setGrid((prev) => prev.map((row, r) => (r < keepFromRow ? row.map(() => 0) : [...row])));
    setIsGameOver(false);
    setBombMode(false);
    setRocketMode(false);
    spawnPoolBlocks();
  };

  const giveAdReward = (kind) => {
    playSound("coin");
    if (kind === "bomb") {
      changeBombs(1);
      setRocketMode(false);
      setBombMode(true);
    } else if (kind === "rocket") {
      changeRockets(1);
      setBombMode(false);
      setRocketMode(true);
    } else if (kind === "clearall") {
      doClearAll();
    } else if (kind === "continue") {
      continueGame();
    }
  };

  const claimAdReward = () => {
    if (!adTask || !adTask.ready) return;

    const nextDone = adTask.done + 1;
    // Masih ada iklan berikutnya (mis. hancurkan semua butuh 2 iklan)
    if (nextDone < adTask.total) {
      setAdTask({ ...adTask, done: nextDone, opened: false, ready: false });
      return;
    }

    const kind = adTask.kind;
    setAdTask(null);
    giveAdReward(kind);
  };

  const handleCellClick = (row, col) => {
    if (isGameOver) return;

    // Mode bom: ledakkan area 3x3
    if (bombMode && bombs > 0) {
      const newGrid = grid.map((r) => [...r]);
      const blastCoords = [];

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && newGrid[r][c] !== 0) {
            newGrid[r][c] = 0;
            blastCoords.push(`${r}-${c}`);
          }
        }
      }

      playSound("bomb");
      blastCells(blastCoords);
      setGrid(newGrid);
      changeBombs(-1);
      setBombMode(false);
      return;
    }

    // Mode roket: langsung hancurkan 4 arah (seluruh baris & kolom)
    if (rocketMode && rockets > 0) {
      const newGrid = grid.map((r) => [...r]);
      const blastCoords = [];
      const clearCell = (r, c) => {
        if (newGrid[r][c] !== 0) {
          newGrid[r][c] = 0;
          blastCoords.push(`${r}-${c}`);
        }
      };

      for (let c = 0; c < GRID_SIZE; c++) clearCell(row, c);
      for (let r = 0; r < GRID_SIZE; r++) clearCell(r, col);

      playSound("bomb");
      blastCells(blastCoords);
      setGrid(newGrid);
      changeRockets(-1);
      setRocketMode(false);
    }
  };

  const checkGameOverCondition = (currentGrid, currentPool) => {
    const remainingBlocks = currentPool.filter((b) => b !== null);
    if (remainingBlocks.length === 0) return;

    let isPossible = false;
    for (let b of remainingBlocks) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlaceBlock(currentGrid, b.matrix, r, c)) {
            isPossible = true;
            break;
          }
        }
        if (isPossible) break;
      }
      if (isPossible) break;
    }

    if (!isPossible) setIsGameOver(true);
  };

  const resetGame = () => {
    playSound("click");
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0)));
    setScore(0);
    setIsGameOver(false);
    setBombMode(false);
    setRocketMode(false);
    setShopItem(null);
    setAdTask(null);
    spawnPoolBlocks();
  };

  const renderBlockMatrix = (block, styleClass = "") => {
    if (!block) return null;
    return (
      <div
        className={`block-matrix ${styleClass}`}
        style={{
          gridTemplateRows: `repeat(${block.matrix.length}, 25px)`,
          gridTemplateColumns: `repeat(${block.matrix[0].length}, 25px)`,
        }}
      >
        {block.matrix.map((row, rIdx) =>
          row.map((val, cIdx) => (
            <div key={`${rIdx}-${cIdx}`} className={val ? `block-unit color-${block.color}` : ""} style={{ opacity: val ? 1 : 0 }} />
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <div className="decorations">
        <div className="rainbow"></div>
        <div className="sun"></div>
      </div>

      <div className="game-layout">
        <div className="game-container">
          <div className="title">BLOCK Q</div>

          <div className="coin-bar">🪙 {coins}</div>

          <div className="score-board">
            <div>SKOR: <span className="score-val">{score}</span></div>
            <div>TERTINGGI: <span className="score-val">{highScore}</span></div>
          </div>

          {bombMode && (
            <div className="bomb-hint">Ketuk kotak untuk meledakkannya! 💥</div>
          )}
          {rocketMode && (
            <div className="bomb-hint">Ketuk kotak untuk roket 4 arah! 🚀</div>
          )}

          <div className={`grid ${bombMode ? "bomb-mode" : ""} ${rocketMode ? "rocket-mode" : ""}`} ref={gridRef}>
            {grid.map((row, r) =>
              row.map((val, c) => {
                let shadowClass = "";
                if (drag.active && drag.block) {
                  const bMatrix = drag.block.matrix;
                  const rRel = r - drag.targetRow;
                  const cRel = c - drag.targetCol;
                  if (rRel >= 0 && rRel < bMatrix.length && cRel >= 0 && cRel < bMatrix[0].length) {
                    if (bMatrix[rRel][cRel] === 1) {
                      shadowClass = drag.isValid ? "shadow-valid" : "shadow-invalid";
                    }
                  }
                }

                const isBlasting = blastingCells.includes(`${r}-${c}`);
                const cellColorClass = val > 0 ? `color-${val} block-unit` : "";

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`cell ${cellColorClass} ${shadowClass} ${isBlasting ? "blasting" : ""}`}
                    onClick={() => handleCellClick(r, c)}
                  ></div>
                );
              })
            )}
          </div>

          <div className="blocks-pool">
            {poolBlocks.map((block, index) => (
              <div
                key={index}
                className="pool-slot"
                onPointerDown={(e) => handlePointerDown(e, index, block)}
                style={{ opacity: drag.active && drag.slotIndex === index ? 0.2 : 1 }}
              >
                {renderBlockMatrix(block)}
              </div>
            ))}
          </div>

          {isGameOver && (
            <div className="game-over-modal">
              <h2>GAME OVER!</h2>
              <p style={{ fontSize: "20px", marginBottom: "20px" }}>
                Skor Akhirmu: <span style={{ color: "#FFEA00", fontWeight: "bold" }}>{score}</span>
              </p>
              <button className="restart-btn" onClick={resetGame}>Main Lagi</button>
              <button className="ad-btn" onClick={() => startAd("continue")}>
                🎬 Lanjut Main (1 Iklan)
              </button>
            </div>
          )}
        </div>

        <div className="shop-panel">
          <button
            className={`bomb-btn ${bombMode ? "active" : ""}`}
            onClick={activateBomb}
            disabled={isGameOver}
          >
            💣 Bom ({bombs})
          </button>
          <button
            className={`rocket-btn ${rocketMode ? "active" : ""}`}
            onClick={activateRocket}
            disabled={isGameOver}
          >
            🚀 Roket ({rockets})
          </button>
          <button
            className="clearall-btn"
            onClick={() => {
              playSound("click");
              setShopItem("clearall");
            }}
            disabled={isGameOver}
          >
            💥 Semua ({CLEAR_ALL_PRICE}🪙)
          </button>
        </div>
      </div>

      {/* Iklan Banner 468x60 */}
      <div className="ad-banner-468">
        <Script
          id="banner-468-options"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "atOptions = { 'key' : '7a720b8bd6f9559390383bafec81d9f6', 'format' : 'iframe', 'height' : 60, 'width' : 468, 'params' : {} };",
          }}
        />
        <Script
          src="https://www.highrevenueformat.com/7a720b8bd6f9559390383bafec81d9f6/invoke.js"
          strategy="afterInteractive"
        />
      </div>

      {shopItem && (
        <div className="buy-modal-overlay" onClick={() => setShopItem(null)}>
          <div className="buy-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {shopItem === "bomb"
                ? "💣 BOM HABIS!"
                : shopItem === "rocket"
                ? "🚀 ROKET HABIS!"
                : "💥 HANCURKAN SEMUA"}
            </h2>
            <p>
              {shopItem === "clearall"
                ? "Beli untuk menghancurkan semua balok sekaligus, atau tonton iklan gratis."
                : `Kamu tidak punya ${shopItem === "bomb" ? "bom" : "roket"}. Beli atau tonton iklan gratis.`}
            </p>
            <div className="coin-display">🪙 {coins}</div>
            <button
              className="buy-btn"
              onClick={buyItem}
              disabled={coins < itemPrice(shopItem)}
            >
              Beli ({itemPrice(shopItem)}🪙)
            </button>
            <button className="ad-btn" onClick={() => startAd(shopItem)}>
              🎬 Tonton Iklan ({itemAds(shopItem)} iklan)
            </button>
            <button className="close-btn" onClick={() => setShopItem(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {adTask && (
        <div className="buy-modal-overlay">
          <div className="buy-modal">
            <h2>🎬 TONTON IKLAN</h2>
            {adTask.total > 1 && (
              <p className="ad-progress">
                Iklan {Math.min(adTask.done + 1, adTask.total)} dari {adTask.total}
              </p>
            )}
            <p>
              Iklan akan terbuka di tab baru. Tonton sampai selesai, kembali ke sini,
              lalu tekan Klaim Hadiah.
            </p>
            {!adTask.opened ? (
              <button className="ad-btn" onClick={openAdTab}>
                ▶ Buka Iklan
              </button>
            ) : adTask.ready ? (
              <button className="buy-btn" onClick={claimAdReward}>
                🎁 Klaim Hadiah
              </button>
            ) : (
              <button className="close-btn" disabled>
                Menunggu iklan selesai...
              </button>
            )}
            <button className="close-btn" onClick={() => setAdTask(null)}>
              Batal
            </button>
          </div>
        </div>
      )}


     {drag.active && drag.block && (
        <div
          className="dragging-block"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`,
            pointerEvents: "none",
            zIndex: 9999
          }}
        >
          {renderBlockMatrix(drag.block)}
        </div>
      )}
    </>
  );
}
