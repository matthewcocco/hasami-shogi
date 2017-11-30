import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// an exercise in React, part 1 of ?
// skeleton of the implementation here is from the Facebook React Tutorial @ https://reactjs.org/tutorial/tutorial.html
// outside of the rules differences & css animations, a lot of the original functionality is adapted.

// uses the Game, Board, and Square components -- although Square is technically a function here? 
// Potential TODO: implement React-DnD and a separate Piece component to add more than click-click-click functionality.
// 
// ~MC / 2017 Nov 29-30

function Square(props) {
  return (
    <button className={"square" + " " + (props.i % 2 === 0 ? "dark" : "bright")} onClick={props.onClick}>
      <div className={"piece" + " " + (props.value === "X" ? "black" : "") + (props.value === "O" ? "white" : "") }>
        {props.value === "X" ? "☗" : ""}
        {props.value === "O" ? "⛊" : ""}
      </div>
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    return (
      <Square
        key={i}
        i={i}
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  render() {
    let dim = this.props.dim,
        rows = [],
        cells = [];

    for (var row = 0; row < dim; row++) {
      for (var i = row * dim; i < row * dim + dim; i++) {
        cells.push(this.renderSquare(i));
      }
      rows.push(<div key={row} className="board-row">{cells}</div>);
      cells = [];
    }
    return (
      <div>{rows}</div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    let X = "X", O = "O"; // translated into unicode shogi pieces later, holdover from tic-tac-toe
    super(props);
    this.state = {
      dimension: 7, // beginning of parametrization
      history: [
        { // hardcoded for 7x7 -- TODO: generalize this for dimension
          squares: [O,O,O,O,O,O,O,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,X,X,X,X,X,X,X]
        }
      ],
      stepNumber: 0,
      xIsNext: true,
      spaceSelected: -1,
    };
  }

  handleClick(i) {
    // time travel
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    const player  = this.state.xIsNext ? "X" : "O";
    const spaceSelected = this.state.spaceSelected;

    // check if there's a winner -- meaning one player has made it to the other side of the board
    // TODO: implement a check to skip clicks on your opponent's piece
    if (calculateWinner(squares)) {
      return;
    }

    // select a piece, if the player owns it
    if (squares[i] === player) {
      this.setState({ spaceSelected: i, validMoves: this.getValidMoves(squares, i) }, () => {
           // console.log(player, this.state.spaceSelected); // DEBUG
      });      
    }

    // if (squares[i] === undefined) console.log(i, spaceSelected); // DEBUG

    // if a valid piece is selected and that space is empty
    if (squares[i] === undefined && spaceSelected >= 0) {

      let movePossible = this.getValidMoves(squares, spaceSelected).indexOf(i) >= 0;
      if(movePossible) {
        // console.log("moving", spaceSelected, "to", i); // DEBUG

        squares[spaceSelected] = undefined;
        squares[i] = player;

        // increment turn, set the state, add history, etc
        this.setState({
          history: history.concat([
            {
              squares: this.capture(squares, i, player),
            }
          ]),
          stepNumber: history.length,
          spaceSelected: -1,
          xIsNext: !this.state.xIsNext
        });
      }
      else {
        // console.log("invalid move"); // DEBUG & TODO: add an animation/marker for this?
        this.setState({
          spaceSelected: -1
        });
      }
    }
  } 

  capture(squares, target, player) {

    console.log("evaluating capture possibilities");

    // check for adjacent captures only; TODO: implement linear captures
    // this is hacked together for a 7-dim board; TODO: generalize
    // 4 cases: NSEW

    // don't forget! there's actually more involved math required 
    // because the board is stored as a contiguous array but is 
    // supposed to be treated like a square.
    // TODO: FIX (improve) THE MATH

    let nAdjacent = squares[target -  7],
        sAdjacent = squares[target +  7],
        eAdjacent = squares[target -  1],
        wAdjacent = squares[target +  1],
        nOver     = squares[target - 14],
        sOver     = squares[target + 14],
        eOver     = squares[target -  2],
        wOver     = squares[target +  2];

    if (nAdjacent !== player && nOver === player) { squares[target - 7] = undefined; }
    if (sAdjacent !== player && sOver === player) { squares[target + 7] = undefined; }
    if (eAdjacent !== player && eOver === player) { squares[target - 1] = undefined; }
    if (wAdjacent !== player && wOver === player) { squares[target + 1] = undefined; }

    return squares;
  }

  getValidMoves(squares, position) {
    let validMoves = [],
        column = position % 7; // hardcoded for board size 7; TODO: generalize this

    // this next bit feels very brute force; // TODO: generalize and optimize this
    
    // check north
    for (let potential = position - 7 ; potential > 0; potential -= 7) {
      // console.log(position, "testing potential", potential);
      if (squares[potential] === undefined) { // if the square is empty, add it to the search space
         validMoves.push(potential);
      }
      else { // we found something in the space; stop searching in this direction.
        break;
      }
    }

    // check south
    for (let potential = position + 7 ; potential < squares.length; potential += 7) {
      // console.log(position, "testing potential", potential);
      if (squares[potential] === undefined) {
         validMoves.push(potential);
      }
      else {
        break;
      }
    }
    
    // check east
    for (let potential = position + 1; potential < position + (7 - column); potential++) {
      console.log(position, column, potential);
      // console.log(position, "testing potential", potential);
      if (squares[potential] === undefined) {
         validMoves.push(potential);
      }
      else {
        break;
      }
    }

    // check west
    for (let potential = position - 1; potential > position - (7 - column); potential--) {
      console.log(position, column, potential);
      // console.log(position, "testing potential", potential);
      if (squares[potential] === undefined) {
         validMoves.push(potential);
      }
      else {
        break;
      }
    }
    console.log(validMoves);
    return validMoves;
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });

    
    const nowplaying = this.state.xIsNext ? "Black" : "White";
    
    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = "Now playing: " + nowplaying;
    }

    return (
      <div className="game">
        <div className="words">
          <h1>Hasami Shogi</h1>
          <p>From <a href="https://en.wikipedia.org/wiki/Hasami_shogi">Wikipedia</a>:</p>
          <p>Hasami shogi (はさみ将棋 hasami shōgi, "intercepting chess") is a variant of shogi (Japanese chess).</p>
          <p>[The game uses] only one type of piece, and the winning objective is not checkmate. A player wins by capturing all but one of their opponent's men.</p>
          <p>All pieces move the same as a rook in shogi. (That is, any number of empty cells vertically or horizontally.) </p> 
          <p>There is no jumping, so a piece can move no further than adjacent to a friendly or enemy piece in its path.</p>
          <hr/>
          <p>In this implementation, the board is currently 7x7 (instead of 9x9).</p>
          <p>Best viewed on screens >1400px wide; cursory testing done in Chrome.</p>
          <hr/>
          TODO:
          <ul>
            <li>(re-)Implement Capture, adding corner capture & more-correct checking</li>
            <li>Implement Multi-Capture (flanking multiple pieces in a line)</li>
            <li>Diagnose & correct occasionally incorrect "invalid move" errors when evaluating horizontal moves
              <ul>
                <li>Negative indices?</li>
                <li>Can't move left/right into open cells in some lategame states?</li>
              </ul>
            </li>
            <li>Diagnose & correct occasional issues with pieces not accepting hovering</li>
            <li>Diagnose & correct occasional css animation misbehavior</li>
            <li>Generalized board math (enable scaling board & behavior from 4x4 to NxN size)</li>
          </ul>
          <hr/>
          <p>Here's the <a href="https://github.com/matthewcocco/hasami-shogi/">code</a> on GitHub.</p>
        </div>
        <div className="perspective">
          <div className={"game-board " + (nowplaying === "White" ? "turn-white" : "turn-black")}>
            <Board
              squares={current.squares}
              onClick={i => this.handleClick(i)}
              dim={this.state.dimension}
            />
          </div>
          <div className="status">{status}</div>
        </div>
        <div className="game-info">
          <ol start="0">{moves}</ol>
        </div>
      </div>
    ); // status & game-info are holdovers from tic-tac-toe
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

function calculateWinner(squares) {
  const x_count = squares.reduce(
    function(n, val) {
      return n + (val === "X");
    }, 0
  );
  const o_count = squares.reduce(
    function(n, val) {
      return n + (val === "O");
    }, 0
  );

  // check for winners? Easier than tic-tac-toe's lines.
  if (o_count <= 1) { console.log("X WINS"); return "X" }
  if (x_count <= 1) { console.log("O WINS"); return "O" }

  return null;
}
