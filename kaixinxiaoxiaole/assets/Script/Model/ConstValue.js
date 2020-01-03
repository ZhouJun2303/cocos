
export const CELL_TYPE = {
    EMPTY : 0,
    A : 1,
    B : 2,
    C : 3,
    D : 4,
    E : 5,
    F : 6,
    BIRD : 7
}
export const CELL_BASENUM = 6;
export const CELL_STATUS = {
    COMMON: 0 ,
    CLICK: "click",
    LINE: "line",
    COLUMN: "column",
    WRAP: "wrap",
    BIRD: "bird"
} 

export const GRID_WIDTH = 6;
export const GRID_HEIGHT = 6;

export const CELL_WIDTH = 80;
export const CELL_HEIGHT = 80;

export const GRID_PIXEL_WIDTH = GRID_WIDTH * CELL_WIDTH;
export const GRID_PIXEL_HEIGHT = GRID_HEIGHT * CELL_HEIGHT;


// ********************   时间表  animation time **************************
export const ANITIME = {
    TOUCH_MOVE: 0.3,
    DIE: 0.2,
    DOWN: 0.2,
    BOMB_DELAY: 0.3,//爆炸延迟
    BOMB_BIRD_DELAY: 0.2,//鸟死亡延迟
    DIE_SHAKE: 0.4 // 死前抖动
}


