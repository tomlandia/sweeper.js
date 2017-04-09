class Square {
    constructor(row, column) {
        this.row = row;
        this.column = column;
        this.hasMine = false;
        this.isOpen = false;
        this.isFlagged = false;
        this.explsion = false;
        this.adjacentMines = 0;
        this.hash = 3000 * row + column; //silliest hash function ever
    }
};

class Sweeper {
    constructor(height, width, mines, $displayDiv) {
        this.$displayDiv = $displayDiv;
        this.height = height;
        this.width = width;
        this.board = [];
        for(let i = 0; i < this.height; i++) {
            let row = [];
            for(let j = 0; j < this.width; j++)
                row.push(new Square(i, j));
            this.board.push(row);
        }
        while(mines > 0) { //FIXIT infinite loop if mines > width*height
            const mineRow = _.random(0, this.height - 1);
            const mineColumn = _.random(0, this.width - 1);
            const square = this.board[mineRow][mineColumn];
            if(!square.hasMine) {
                square.hasMine = true;
                this.neighbors(square).forEach((neighbor) => neighbor.adjacentMines++);
                mines--;
            }
        }
        this.render();
        const [LEFT_CLICK, RIGHT_CLICK] = [1,3];

        $displayDiv.unbind();
        $displayDiv.on('mousedown', '.square', (event) => {
            event.preventDefault();
            const square = this.board[parseInt(event.target.dataset.row)][parseInt(event.target.dataset.column)];
            if(event.which === LEFT_CLICK && !square.isOpen) {
                this.open(square);
            } else if(event.which === RIGHT_CLICK && !square.isOpen) {
                this.toggleFlag(square);
            }
        });
        $displayDiv.on('contextmenu', () => false);
    }

    open(square) {
        square.isOpen = true;
        if(square.hasMine) {
            square.explosion = true;
            for(let i = 0; i < this.height; i++)
                for(let j = 0; j < this.width; j++)
                    if(this.board[i][j].hasMine)
                        this.board[i][j].isOpen = true;
            this.$displayDiv.unbind();
        } else if(square.adjacentMines == 0) {
            let openedSquareHashes = new Set([square.hash]);
            let frontier = [square];
            while(frontier.length > 0) {
                square = frontier.pop();
                square.isOpen = true;
                if(!square.adjacentMines) {
                    let unvisitedNeighbors = this.neighbors(square).filter((neighbor) => {
                        return (!neighbor.isOpen) && (!neighbor.hasMine) && !(openedSquareHashes.has(neighbor.hash));
                    });
                    unvisitedNeighbors.forEach((neighbor) => {
                        frontier.push(neighbor);
                        openedSquareHashes.add(neighbor.hash);
                    });
                }
            }
        }
        this.render();
    }

    toggleFlag(square) {
        square.isFlagged = !square.isFlagged;
        this.render();
    }

    hasWon() {
        for(let i = 0; i < this.height; i++) {
            for(let j = 0; j < this.width; j++) {
                const square = this.board[i][j];
                if(!(square.isOpen || square.hasMine)) {
                    return false;
                }
            }
        }
        return true;
    }

    neighbors(square) {
        const {row, column} = square;
        let potentialNeighbors = [
            this.board[row][column-1],
            this.board[row][column+1]
        ];
        let [rowUp, rowDown] = [this.board[row-1], this.board[row+1]];
        if(rowUp) {
            potentialNeighbors.push(rowUp[column-1]);
            potentialNeighbors.push(rowUp[column]);
            potentialNeighbors.push(rowUp[column+1]);
        }
        if(rowDown) {
            potentialNeighbors.push(rowDown[column-1]);
            potentialNeighbors.push(rowDown[column]);
            potentialNeighbors.push(rowDown[column+1]);
        }
        return _.filter(potentialNeighbors);
    }

    render() {
        this.$displayDiv.html(this.board.map((row) => {
            let squaresHtml = row.map((square) => {
                let classes = 'square';
                if(square.explosion) classes += ' explosion'
                if(square.isOpen) classes += ' open'
                if(square.adjacentMines) classes += ` color-${square.adjacentMines}`

                let content = '';
                if(square.isFlagged)
                    content = '<i class="fa fa-flag" aria-hidden="true"></i>';
                else if(square.isOpen && square.hasMine)
                    content = '<i class="fa fa-bomb" aria-hidden="true"></i>';
                else if(square.isOpen && square.adjacentMines)
                    content = `<span class="content">${square.adjacentMines}</span>`;
                return `<div class="${classes}" data-row="${square.row}" data-column="${square.column}">${content}</div>`;
            });
            return `<div class="row">${squaresHtml.join('')}</div>`;
        }));
    }
};


$(document).ready(function() {
    let newGame = () => {
        const [height, width, mines] = [+$('#height').val(), +$('#width').val(), +$('#mines').val()];
        if(height > 0 && width > 0 && mines < width * height) {
            new Sweeper(height, width, mines, $('#sweeper'));
        }
    };
    $('#new-game').on('click', newGame);

    newGame();
});
