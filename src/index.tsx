import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// ========================================

type PlayerType = 'X' | 'O'
type SquareType = PlayerType | null
type SquaresType = SquareType[]

// ========================================

type SquarePropsType = {
  value: PlayerType | null,
  onClick: () => void,
  isHighlight: boolean
}

function Square(props: SquarePropsType): JSX.Element {
  const style: React.CSSProperties = props.isHighlight ? {'background': 'yellow'} : {};
  return (
    <button className="square" onClick={props.onClick} style={style}>
      {props.value}
    </button>
  );
}

// ========================================

type BoardPropsType = {
  squares: SquaresType,
  onClick: (i: number) => void
}

class Board extends React.Component<BoardPropsType> {
  renderSquare(i: number, isHighlight: boolean): JSX.Element {
    return (
      <Square
        value={this.props.squares[i]}
        onClick={(): void => this.props.onClick(i)}
        isHighlight={isHighlight}
        key={i}
      />
    );
  }

  render(): JSX.Element {
    const boardSize = 3;
    let board: JSX.Element[] = [];
    const winnerLine: number[] | null = calculateWinner(this.props.squares).line;
    for (let row = 0; row < boardSize; row++) {
      let boardRow: JSX.Element[] = [];
      for (let col = 0; col < boardSize; col++) {
        const squareIndex = boardSize * row + col;
        let isHighlight;
        if (winnerLine !== null) {
          isHighlight = winnerLine.includes(squareIndex);
        } else {
          isHighlight = false;
        }
        boardRow = boardRow.concat([this.renderSquare(squareIndex, isHighlight)]);
      }
      board = board.concat([<div className="board-row" key={row}>{boardRow}</div>]);
    }
    return <div>{board}</div>;
  }
}

// ========================================

type HistoryType = {squares: SquaresType}[]
type MovePropsType = {
  location: GetLocationResultType,
  // history: HistoryType,
  historyIndex: number,
  stepNumber: number,
  onClick: () => void,
}

class Move extends React.Component<MovePropsType> {
  render(): JSX.Element {
    // const history = this.props.history;
    const historyIndex = this.props.historyIndex;
    let desc: string;
    if (historyIndex === 0) {
      desc = 'Go to game start';
    } else {
      const player = this.props.location.player as PlayerType;
      const row = this.props.location.row;
      const col = this.props.location.col;
      desc = `Go to move #${historyIndex} - player:${player}, row:${row}, col:${col}`;
    }

    const style: React.CSSProperties =
      (historyIndex === this.props.stepNumber) ? {'fontWeight': 'bolder'} : {};

    return (
      <li key={historyIndex}>
        <button onClick={this.props.onClick} style={style}>{desc}</button>
      </li>
    );
  }
}

// ========================================

type GameStateType = {
  history: HistoryType,
  stepNumber: number,
  xIsNext: boolean,
  isReverse: boolean,
}

class Game extends React.Component<Record<string, never>, GameStateType> {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      history: [{
        squares: Array<SquareType>(9).fill(null),
      }],
      stepNumber: 0,
      xIsNext: true,
      isReverse: false,
    };
  }

  handleClick(i: number): void {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares).winner || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext,
    });
  }

  jumpTo(step: number): void {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  renderMoves(history: HistoryType): JSX.Element[] {
    let moves: JSX.Element[] = [];
    for (let i = 0; i < history.length; i++) {
      const move: JSX.Element =
        <Move
          location={getLocation(history, i)}
          historyIndex={i}
          stepNumber={this.state.stepNumber}
          onClick={(): void => this.jumpTo(i)}
          key={i}
        />;
      moves = moves.concat([move]);
    }
    return moves;
  }

  toggleSortOrder(): void {
    this.setState({isReverse: !this.state.isReverse});
  }

  render(): JSX.Element {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares).winner;
    const moves = this.renderMoves(history);

    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else if (this.state.stepNumber === 9) {
      status = 'Draw';
    }else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board
            squares={current.squares}
            onClick={(i: number): void => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <button onClick={(): void => this.toggleSortOrder()}>{'toggle location order'}</button>
          <ol>{this.state.isReverse ? moves.slice().reverse() : moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

const rootElement: JSX.Element = (
  <div>
    <h1>Tic Tac Toe</h1>
    <Game />
  </div>
);

ReactDOM.render(
  rootElement,
  document.getElementById('root')
);

type CalculateWinnerResultType = {
  winner: PlayerType | null,
  line: number[] | null
};

function calculateWinner(squares: SquaresType): CalculateWinnerResultType {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {winner: squares[a], line: lines[i]};
    }
  }
  return {winner: null, line: null};
}

type GetLocationResultType = {col: number, row: number, player: PlayerType | null}
function getLocation(history: HistoryType, move: number): GetLocationResultType {
  const boardSize = 3;
  let squareIndex: number| null = null;

  if (move <= 0) {
    return {col: -1, row: -1, player: null};
  }

  const previousSquares: SquaresType = history[move - 1].squares;
  const currentSquares: SquaresType = history[move].squares;
  for (let i = 0; i < currentSquares.length; i++) {
    if (previousSquares[i] !== currentSquares[i]){
      squareIndex = i;
    }
  }
  if (squareIndex === null) {
    throw new Error('squareIndex is null');
  }
  return {
    col: squareIndex % boardSize + 1,
    row: Math.floor(squareIndex / boardSize) + 1,
    player: currentSquares[squareIndex]
  };
}
