const mainArea=document.getElementById("main")//書き換えるmainのhtmlElement
const canvas=document.getElementById("myCanvas")//書き換えるcanvasのhtmlElement
const ctx=canvas.getContext("2d")//なんかcanvasで使うらしいやつ
const flame=300//コマが1マス移動するのにかかる時間[ms]
const display={
    get width(){//画面の横幅
        return mainArea.clientWidth
    },
    get height(){//画面の縦幅
        return mainArea.clientHeight
    }
}
const space={//マスのプロパティ等
    get width(){//マスの横幅[px]
        let result=150
        try{
            result=mainArea.children[0].offsetWidth
        }catch(exception){
        }
        return result
    },
    get height(){//マスの縦幅[px]
        let result=100
        try{
            result=mainArea.children[0].offsetHeight
        }catch(exception){
        }
        return result
    },
    get number(){//マスの数
        return mainArea.childElementCount
    },
    get numberXMax(){//横に入るマスの最大数
        return Math.floor(display.width/this.width)
    },
    get elements(){//マスのhtmlElementを保持する配列
        const result=new Array
        for(let i=0;i<this.number;i++){
            result.push(mainArea.children[i])
        }
        return result
    }
}
function sleep(waitSec){
    return new Promise(function (resolve) {
        setTimeout(function() { resolve() }, waitSec);
    });
}
const spaceConfig={//マスの設定
    spaceLength:10,//マスの量
    eventDistance:1,//〇マスごとにイベントをランダムで作成する
    eventProbability:0.7,//〇%でイベントを作成する
    eventList:[//イベントIDのリスト
        {
            event:"move",
            property:1
        },
        {
            event:"move",
            property:1
        },
        {
            event:"move",
            property:1
        },
        {
            event:"move",
            property:3
        },
        {
            event:"move",
            property:3
        },
        {
            event:"move",
            property:6
        },
        {
            event:"move",
            property:-2
        },
        {
            event:"move",
            property:-2
        },
        {
            event:"move",
            property:-3
        }
    ]
}

function createSpaceList(amount){//マスのリストを作成する関数
    const result=new Array
    result.push({content:"スタート",event:"",property:0})
    for(let i=1;i<(amount+1);i++){
        const newSpace={
            content:"",
            event:"",
            property:0
        }
        if(i%spaceConfig.eventDistance===0){//〇マスごとに
            if((1-spaceConfig.eventProbability)<Math.random()){//〇%の確率で
                const pickedEvent=spaceConfig.eventList[Math.floor(Math.random()*spaceConfig.eventList.length)]//イベントリストからイベントを1つ適用する
                switch(pickedEvent.event){
                    case "move":
                        if(pickedEvent.property>0){
                            newSpace["content"]=`${pickedEvent.property}マス進む`
                        }else if(pickedEvent.property<0){
                            newSpace["content"]=`${(pickedEvent.property)*-1}マス戻る`
                        }
                        break
                    default:
                        break
                }
                newSpace["event"]=pickedEvent.event
                newSpace["property"]=pickedEvent.property
            }
        }
        result.push(newSpace)
    }
    result.push({content:"ゴール",event:"",property:1})
    return result
}
function createSpaceElement(spaceArray){//マスのHTML要素を作成する関数
    for(let i in spaceArray){
        mainArea.innerHTML+=`<div>${spaceArray[i].content}</div>`
        //mainArea.innerHTML+=`<div>${i}<br>${spaceArray[i].content}</div>`
    }
}

class Piece{//すごろくで使うコマ
    _x=0//x座標
    _y=0//y座標
    _index//場所
    _radius=10//半径
    _color="#000000"
    _index=0
    constructor(index,radius,color){
        this._index=index
        this._radius=radius
        this._color=color
    }
    /* getter/setter */
    get x(){
        return this._x
    }
    set x(x){
        this._x=x
    }
    get y(){
        return this._y
    }
    set y(y){
        this._y=y
    }
    get index(){
        return this._index
    }
    set index(index){
        this._index=index
    }
    get radius(){
        return this._radius
    }
    set radius(radius){
        this._radius=radius
    }
    get color(){
        return this._color
    }
    set color(color){
        this._color=color
    }
    /* 関数など */
    draw(x=this.x,y=this.y){//コマの位置を更新するメソッド
        ctx.beginPath();
        ctx.arc(x,y,this.radius,0,Math.PI*2,false)
        ctx.fillStyle=this.color
        ctx.fill()
        ctx.closePath();
    }
    move(index){//指定されたコマの位置に移動するメソッド
        const clientRect=space.elements[index].getBoundingClientRect()
        const px=(window.pageXOffset + clientRect.left) + (space.width/2) - (this.radius/2)//指定マスのページ内のx座標
        const py=(window.pageYOffset + clientRect.top) + (space.height/2) - (this.radius/2)//指定マスのページ内のy座標
        this.x=px
        this.y=py
    }
    async translate(index){//指定されたコマの位置まで移動するメソッド
        while(this.index!==index){
            if((this.index===0)&&(index<0)){break}//スタートより戻ろうとしたら止まる
            if(this.index>=(space.number-1)){break}//ゴールしたら止まる
            await sleep(flame)
            if(this.index<index){
                this.index+=1
            }else{
                this.index-=1
            }
            updateAllPiece()
        }
        await sleep(flame)
    }
}
const pieces=[//プレイヤーが使うコマを格納するクラス配列
    new Piece(0,10,"#00FFFF"),
    new Piece(0,10,"#FF00FF"),
]

/* HTMLを更新する関数達 */
function resizeCanvas(){//canvasの幅をmainに合わせる関数
    canvas.width=display.width
    canvas.height=display.height
}
function adjustSpace(){//マスのレイアウトを変更する関数
    const displayWidth=display.width
    for(let i=0;i<space.number;i++){
        const row=Math.floor(i/(space.numberXMax+1))//マスの行(折り返しを含む)
        space.elements[i].style=""
        if(row%2===0){//右向き段
            //space.elements[i].style.color="red"
            if((i+1)%(space.numberXMax+1)===0){//右向き折り返し
                //space.elements[i].style.color="black"
                space.elements[i].style.clear="both"
                space.elements[i].style.marginLeft="auto"
                space.elements[i].style.marginRight=`${(displayWidth)-(space.width*space.numberXMax)}px`
            }else{
                if(((i+1)%(space.numberXMax+1)===space.numberXMax)&&(space.numberXMax>1)){
                    //左端の要素はすこし入りきらなくて浮かせないとfloatがバグる
                    space.elements[i].style.position="absolute"
                    space.elements[i].style.marginLeft=`${space.width*(space.numberXMax-1)}px`
                }else{
                    space.elements[i].style.float="left"
                }
            }
        }else{//左向き段
            //space.elements[i].style.color="blue"
            if((i+1)%(space.numberXMax+1)===0){//左向き折り返し
                //space.elements[i].style.color="black"
                space.elements[i].style.clear="both"
                space.elements[i].style.marginLeft="0"
                space.elements[i].style.marginRight="auto"
            }else{
                if(((i+1)%(space.numberXMax+1)===space.numberXMax)&&(space.numberXMax>1)){
                    //左端の要素はすこし入りきらなくて浮かせないとfloatがバグる
                    space.elements[i].style.position="absolute"
                }else{
                    space.elements[i].style.float="right"
                    if((i+1)%(space.numberXMax+1)===1){
                        //折り返して最初の要素にはmargin-rightを設定する
                        space.elements[i].style.marginRight=`${(displayWidth)-(space.width*space.numberXMax)}px`
                    }
                }
            }
        }

        try{//イベントマスに色をつける
            if(spaces[i].event==="move"){
                if(spaces[i].property>0){
                    space.elements[i].style.color="blue"
                }else if(spaces[i].property<0){
                    space.elements[i].style.color="red"
                }
            }
        }catch(e){}
    }
}
function updateAllPiece(){//全てのコマの位置を更新する関数
    ctx.clearRect(0, 0, canvas.width, canvas.height)//canvasを初期化
    for(let i in pieces){
        pieces[i].move(pieces[i].index)
        pieces[i].draw()
    }
}
function updateHtml(){//htmlを更新する関数
    adjustSpace()//マスのレイアウトを変更する
    resizeCanvas()//canvasの幅をmainに合わせる
    updateAllPiece()//全てのコマの位置を更新する
}

/* ダイス処理 */
const diceImages=[//さいころ画像パスの配列
    "resource/1さいころ.jpg",
    "resource/2さいころ.jpg",
    "resource/3さいころ.jpg",
    "resource/4さいころ.jpg",
    "resource/5さいころ.jpg",
    "resource/6さいころ.jpg"
]
const dice=document.getElementById("dice");//2Dダイス
const animateDice=document.querySelector(".dice");//3Dダイス
dice.src=diceImages[0];//2Dダイスの初期面
animateDice.style.display="none"//3Dダイスを非表示にする
const diceBox=document.getElementById("diceBox")//ダイス画面
diceBox.style.display="none"//ダイス画面を非表示にする
let diceIndex=0//ダイスの目
const WaitForClick = () => new Promise(resolve => document.addEventListener("click", resolve));
async function diceRoll(){//ダイスを振る関数
    diceBox.style.display="block"//ダイス画面を表示する

    await WaitForClick();

    dice.style.display="none"
    animateDice.style.display="block"
    timerId=setInterval(()=>{ 
        diceIndex=Math.floor(Math.random() * diceImages.length)
        dice.src=diceImages[diceIndex]
    },200)

    await WaitForClick();

    clearInterval(timerId);
    animateDice.style.display="none"
    dice.style.display="block"

    await WaitForClick();

    diceBox.style.display="none"
    const result=diceIndex+1
    return result
}

/* イベント処理 */
async function happenEvent(piece,array,index){//イベントを起こす関数
    const happenedEvent=array[index].event
    const eventProperty=array[index].property
    switch(happenedEvent){
        case "move":
            await pieceMove(piece,array,eventProperty)
            break
        default:
            break
    }
}
async function pieceMove(piece,array,movement){//コマを移動させる効果のマスの処理
    alert(space.elements[piece.index].textContent)
    await piece.translate((piece.index)+(movement))//コマを移動させる
    await happenEvent(piece,array,piece.index)
}
async function isGameEnd(classArray,goalIndex){//コマの中の誰か一人でもゴールに到達していたらtrueを返す関数
    let result=false
    for(let i in classArray){
        if(classArray[i].index>=goalIndex){
            result=true
        }
    }
    return result
}
async function whoWin(classArray,goalIndex){//誰がゴールしたか調べる関数
    let result=new Array
    for(let i in classArray){
        if(classArray[i].index>=goalIndex){
            result.push(i)
        }
    }
    return result.join()
}
const spaces=createSpaceList(spaceConfig.spaceLength)//マスのリスト
async function createGameMap(){//ゲームマップを作成する関数
    createSpaceElement(spaces)//マスを作成する
    updateHtml()
    window.addEventListener("resize",updateHtml)//リサイズ時にfix処理を適用する
}
async function runGame(){//ゲームを起動する関数
    gameLoop:while(true){
        for(let i in pieces){
            alert(`プレイヤー${i}の番です。`)
            await WaitForClick()
            const movement=await diceRoll()
            await pieces[i].translate((pieces[i].index)+movement)//コマを移動させる
            await happenEvent(pieces[i],spaces,pieces[i].index)
            if(await isGameEnd(pieces,space.number-1)){break gameLoop}
        }
    }
    alert(`プレイヤー${await whoWin(pieces,space.number-1)}がゴールしました。`)
}


/* ここから実際の処理 */
async function main(){//ウィンドウが読み込まれたときの処理
    await createGameMap()
    await WaitForClick()
    await runGame()
}
window.onload=(event)=>{
    main()
}



/* デバッグ処理 */
window.document.onkeydown = function(event){
    if (event.key === "Enter") {
        debug()
    }
}
function debug(){
/*     const place=window.prompt("コマをどこに移動しますか？","0")
    if(place!==""){
        const placeNumber=Number(place)
        if(Number.isNaN(placeNumber)===false){
            pieces[0].translate(placeNumber)//コマを移動させる
        }
    }else{
        return//エラー
    } */
}