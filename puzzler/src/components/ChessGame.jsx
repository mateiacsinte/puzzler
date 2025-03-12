import { useState, useEffect } from "react";
import Chess from "chess.js";
import { Chessboard } from "react-chessboard";

function ChessGame() {
    const puzzle = [{
    "fen": "r1bqk2r/2p1bppp/p1np1n2/1p2p3/4P3/1B3N2/PPPP1PPP/RNBQR1K1 w kq - 0 8",
    "solution": ["c3", "O-O", "h3", "Nb8", "d4"]
  },
  {
    fen: "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2",
    solution: ["Nf3", "Nf6", "c4", "e6", "Nc"]
  }]


  const [index, setSolutionIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0)


  const [currentTimeout, setCurrentTimeout] = useState(null);
  const [boardWidth, setBoardWidth] = useState(window.innerWidth * 0.4);

  const [game, setGame] = useState(new Chess(puzzle[puzzleIndex].fen));


  useEffect(() => {
    setGame(new Chess(puzzle[puzzleIndex].fen));
    setSolutionIndex(0);
  }, [puzzleIndex]);

  // Update boardWidth when the window is resized
  useEffect(() => {
    const handleResize = () => setBoardWidth(window.innerWidth * 0.4);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  function makeRandomMove() {
    // const possibleMoves = game.moves();
    // console.log(possibleMoves)
    // if (game.game_over() || game.in_draw() || possibleMoves.length === 0) return;
    // const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    // safeGameMutate((game) => game.move(possibleMoves[randomIndex]));
    setSolutionIndex((prevIndex) => {
      console.log("prevIndex", prevIndex)
      console.log("sol length",  puzzle[puzzleIndex].solution.length)
      if(prevIndex < puzzle[puzzleIndex].solution.length - 1){
        console.log("random triggered");
        console.log("move", puzzle[puzzleIndex].solution[index+1]);
        safeGameMutate((game) => game.move(puzzle[puzzleIndex].solution[index+1]));
        const newIndex = prevIndex + 2;
        return newIndex
      }else{
        onNextPuzzle();
        return 0;
      }
      
    });
  }

  function onNextPuzzle() {
    const nextIndex = puzzleIndex + 1;
    if (nextIndex < puzzle.length) {
      setPuzzleIndex(nextIndex);
    } else {
      // Optionally loop back or handle end-of-puzzles
      console.log("No more puzzles!");
    }
  }

  function onDrop(sourceSquare, targetSquare, piece) {
    console.log("index", index)
    console.log("from square", sourceSquare)
    console.log("to square", targetSquare)
    console.log("piece", piece)
    // Create a new game instance from current fen after making a move.
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() ?? "q",
    });
    console.log("move", move)

    if (move === null) return false;

    // If move is illegal, return false so the piece snaps back.
    if (move.san === puzzle[puzzleIndex].solution[index]){
      console.log("move san", move.san)
      console.log("puzz sol move", puzzle[puzzleIndex].solution[index])

      // Update game state by creating a new Chess instance from the new FEN.
      setGame(new Chess(game.fen()));


      //Execute a random move after a short delay.
      const newTimeout = setTimeout(makeRandomMove, 0);
      setCurrentTimeout(newTimeout);
      return true;
    }

    console.log("Incorrect move, reverting.");
    // Revert the incorrect move.
    game.undo();
    // Ensure the board state is updated after the undo.
    setGame(new Chess(game.fen()));
    return false;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Chessboard
        id="PlayVsRandom"
        boardWidth={boardWidth}
        position={game.fen()}
        onPieceDrop={onDrop}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      />
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => {
            safeGameMutate((game) => game.reset());
            clearTimeout(currentTimeout);
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            safeGameMutate((game) => game.undo());
            clearTimeout(currentTimeout);
          }}
        >
          Undo
        </button>
        <button onClick={onNextPuzzle}>Next Puzzle</button>
      </div>
    </div>
  );
}

export default ChessGame;
