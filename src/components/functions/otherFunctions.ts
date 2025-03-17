//возвращает случайное число
export function getRandomValue(min: number, max: number): number {
    /*min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1) + min)*/

    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    let randomNumber = randomBuffer[0] / (0xffffffff + 1);
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(randomNumber * (max - min + 1)) + min;
}

//возвращает UID
export function getUID(): string {
    return (~~(Math.random()*1e8)).toString(16)
}

//перемешать элементы массива
export function shuffleArr<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = getRandomValue(0, i);
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
}

//создание и инициализация матрицы
export function createMatrix<T>(rows: number, cols: number, initValue: T): T[][] {
    let matrix: T[][] = new Array(rows)
    if (typeof(initValue) !== 'object') {
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols)
            for (let j = 0; j < cols; j++) matrix[i][j] = initValue
        }
    }
    else {
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols)
            for (let j = 0; j < cols; j++) matrix[i][j] = JSON.parse(JSON.stringify(initValue)) 
        }
    }
    return matrix
}

//клонирование объекта
export function cloneObj<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

//расчет диаметра закрашиваемой обл-ти, начальной и конечной позиций
export function countArea(i: number, j: number, radius: number, rows: number, cols: number) {
    let diameter = 2 * radius + 1//диаметр закрашиваемой зоны
    //start - начальная точка, delta - вычитаем из радиуса, если уперлись в край карты
    let startI: number, startJ: number, deltaI = 0, deltaJ = 0
    if (i - radius < 0) {startI = 0; deltaI = radius - i;} 
    else startI = i - radius
    if (j - radius < 0) {startJ = 0; deltaJ = radius - j;} 
    else startJ = j - radius
    let finishI = (startI + diameter > rows) ? rows : startI + diameter - deltaI
    let finishJ = (startJ + diameter > cols) ? cols : startJ + diameter - deltaJ
    return {startI, startJ, finishI, finishJ}
}

//вспомогательная ф-ия - добавляет новый свойства в старый объект
/*export function mergeStatChanges(obj, modifier) {
    for (let prop in obj) {
        if (modifier.hasOwnProperty(prop)) {
            obj[prop] -= modifier[prop]
        }
    }
}*/