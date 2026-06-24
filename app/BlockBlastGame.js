"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GRID_SIZE = 8;
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
  
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobileLeaderboardOpen, setIsMobileLeaderboardOpen] = useState(false);

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

  // --- FUNGSI AMBIL DATA DARI SUPABASE (SUDAH DISARING) ---
  const fetchTopScores = async () => {
    // 1. Ambil data lebih banyak (misal 100 teratas) agar bisa disaring
    const { data, error } = await supabase
      .from("leaderboard")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Gagal mengambil data peringkat:", error.message || error);
      return;
    }

    if (data) {
      // 2. Menyaring agar 1 nama hanya menyimpan 1 skor terbesarnya
      const uniqueMap = {};
      data.forEach((item) => {
        if (!item || !item.username) return;
        
        // Ubah nama jadi huruf kecil semua untuk pengecekan (Rizki = rizki)
        const nameKey = item.username.trim().toLowerCase(); 
        
        if (!uniqueMap[nameKey] || item.score > uniqueMap[nameKey].score) {
          uniqueMap[nameKey] = { username: item.username, score: item.score };
        }
      });

      // 3. Ubah kembali ke format daftar, urutkan lagi dari terbesar, ambil 10 teratas
      let finalTop10 = Object.values(uniqueMap)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // 4. Isi kekosongan jika total pemain unik belum sampai 10 orang
      while (finalTop10.length < 10) {
        finalTop10.push({ username: "-", score: 0 });
      }
      
      setLeaderboard(finalTop10);
    }
  };

  // --- FUNGSI SIMPAN DATA KE SUPABASE ---
  const uploadScoreGlobal = async (targetUser, targetScore) => {
    const { error } = await supabase
      .from("leaderboard")
      .insert([{ username: targetUser, score: targetScore }]);

    if (error) {
      console.error("Gagal mengirim skor ke Supabase:", error);
    } else {
      fetchTopScores();
    }
  };

  // --- INITIAL LOAD EFFECT ---
  useEffect(() => {
    fetchTopScores();

    const savedUser = localStorage.getItem("block_blast_user");
    if (savedUser) {
      setUsername(savedUser);
      setIsLoggedIn(true);
    }

    const savedHigh = localStorage.getItem("block_blast_high");
    if (savedHigh) setHighScore(parseInt(savedHigh, 10));
    
    spawnPoolBlocks();
  }, []);

  // --- GAME OVER EFFECT ---
  useEffect(() => {
    if (isGameOver && score > 0) {
      playSound("gameover");
      
      uploadScoreGlobal(username, score);

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("block_blast_high", score.toString());
      }
    }
  }, [isGameOver, score, username]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    playSound("click");
    const cleanName = inputName.trim().substring(0, 12);
    localStorage.setItem("block_blast_user", cleanName);
    setUsername(cleanName);
    setIsLoggedIn(true);
  };

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
    if (!block || !isLoggedIn) return;
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
      let blastScore = (rowsToClear.length + colsToClear.length) * 100;
      updateScore(blastScore);

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
    spawnPoolBlocks();
  };

  const toggleMobileLeaderboard = (openState) => {
    playSound("click");
    setIsMobileLeaderboardOpen(openState);
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

      {isLoggedIn && (
        <button className="leaderboard-toggle-btn" onClick={() => toggleMobileLeaderboard(true)}>
          🏆 Peringkat
        </button>
      )}

      <div className="game-layout">
        
        <div className={`leaderboard-container ${isMobileLeaderboardOpen ? "mobile-open" : ""}`}>
          <button className="leaderboard-close-btn" onClick={() => toggleMobileLeaderboard(false)}>
            ✕
          </button>

          <div className="leaderboard-title">🏆 TOP 10 REKOR</div>
          <div className="leaderboard-list">
            {leaderboard.map((item, idx) => {
              let rankStyle = "";
              if (idx === 0) rankStyle = "rank-1";
              else if (idx === 1) rankStyle = "rank-2";
              else if (idx === 2) rankStyle = "rank-3";

              return (
                <div key={idx} className={`leaderboard-item ${rankStyle}`}>
                  <span>#{idx + 1}</span>
                  <span className="rank-name">{item?.username || "-"}</span>
                  <span>{item?.score || 0} Pts</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="game-container">
          <div className="title">BLOCK Q</div>
          
          {isLoggedIn && <div className="user-tag">Pemain: {username}</div>}

          <div className="score-board">
            <div>SKOR: <span className="score-val">{score}</span></div>
            <div>TERTINGGI: <span className="score-val">{highScore}</span></div>
          </div>

          <div className="grid" ref={gridRef}>
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
                  <div key={`${r}-${c}`} className={`cell ${cellColorClass} ${shadowClass} ${isBlasting ? "blasting" : ""}`}></div>
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

          {!isLoggedIn && (
            <div className="auth-modal">
              <h2>SIAPA NAMAMU?</h2>
              <form onSubmit={handleLoginSubmit} style={{ width: "100%", textAlign: "center" }}>
                <input
                  type="text"
                  placeholder="Masukkan Username..."
                  className="login-input"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  maxLength={12}
                />
                <br />
                <button type="submit" className="start-btn">Mulai Main</button>
              </form>
            </div>
          )}

          {isGameOver && (
            <div className="game-over-modal">
              <h2>GAME OVER!</h2>
              <p style={{ fontSize: "20px", marginBottom: "20px" }}>
                Skor Akhirmu: <span style={{ color: "#FFEA00", fontWeight: "bold" }}>{score}</span>
              </p>
              <button className="restart-btn" onClick={resetGame}>Main Lagi</button>
            </div>
          )}
        </div>

      </div>

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