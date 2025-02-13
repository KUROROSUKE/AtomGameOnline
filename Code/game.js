let p1_hand = []; let p2_hand = []
let p1_point = 0; let p2_point = 0
let p1_selected_card = []; let p2_selected_card = []

const card_num = 8
let WIN_POINT = card_num*30+10
let WIN_TURN = 10

let dropped_cards_p1 = []; let dropped_cards_p2 = []

let turn = "p1"
let time = "game"
let numTurn = 1

const elementToNumber = {"H": 1, "He": 2, "Li": 3, "Be": 4, "B": 5, "C": 6, "N": 7, "O": 8, "F": 9, "Ne": 10,"Na": 11, "Mg": 12, "Al": 13, "Si": 14, "P": 15, "S": 16, "Cl": 17, "Ar": 18, "K": 19, "Ca": 20,"Fe": 26, "Cu": 29, "Zn": 30, "I": 53}
const elements = [...Array(6).fill('H'), ...Array(4).fill('O'), ...Array(4).fill('C'),'He', 'Li', 'Be', 'B', 'N', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca','Fe', 'Cu', 'Zn', 'I']
const element = ['H','O','C','He', 'Li', 'Be', 'B', 'N', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca','Fe', 'Cu', 'Zn', 'I']
let deck = [...elements, ...elements]
let materials = []
let imageCache = {}


//変える必要があるコード
/*
ホスト側だけでの処理：deckの作成・手札の作成
共通で管理：手札・ポイント



*/
//　load materials
async function loadMaterials() {
    const response = await fetch('../compound/standard.json')
    const data = await response.json()
    if (!data.material || !Array.isArray(data.material)) {
        return []
    }
    return data.material
}


// main code
async function view_p2_hand() {
    const area = document.getElementById('p2_hand')
    p2_hand.forEach((elem, index) => {
        const image = document.createElement("img")
        image.src = imageCache[elementToNumber[elem]].src
        image.alt = elem
        image.style.padding = "5px"
        image.style.border = "1px solid #000"
        image.classList.add("selected")
        image.addEventListener("click", function() {
            const button = document.getElementById("ron_button")
            button.style.display = "none"
            if (time == "make") {
                this.classList.toggle("selected")
                if (this.classList.contains("selected")){
                    this.style.border = "1px solid #000"
                    this.style.padding = "5px"
                    p2_selected_card.splice(p2_selected_card.indexOf(this.alt),1)
                } else {
                    this.style.border = "5px solid #F00"
                    this.style.padding = "1px"
                    p2_selected_card.push(this.alt)
                }}
            if (turn == name && time == "game") {
                dropped_cards_p2.push(this.alt)
                const img = document.createElement("img")
                img.alt = this.alt
                img.src = imageCache[elementToNumber[this.alt]].src
                img.style.border = "1px solid #000"
                document.getElementById("dropped_area_p2").appendChild(img)
                this.classList.remove("selected")
                this.classList.add("selected")
                let newElem = drawCard()
                this.src = imageCache[elementToNumber[newElem]].src
                this.alt = newElem
                this.style.padding = "5px"
                this.style.border = "1px solid #000"
                p2_hand[index] = newElem
                console.log(turn)
                turn = (turn == "p2") ? "p1" : "p2";
                changeTurn(turn)
                shareAction(action="exchange",otherData=img.alt)
                setTimeout(() => {p1_action()},500)
            }
        })
        area.appendChild(image)
    })
}

async function view_p1_hand() {
    const area = document.getElementById('p1_hand')
    p1_hand.forEach((elem, index) => {
        const image = document.createElement("img")
        image.src = imageCache[0].src
        image.alt = "相手の手札"
        image.style.padding = "5px"
        image.style.border = "1px solid #000"
        image.classList.add("selected")
        area.appendChild(image)
    })
}

async function search(components) {
    return materials.find(material => {
        for (const element in components) {
            if (!material.components[element] || material.components[element] !== components[element]) {
                return false;
            }
        }
        for (const element in material.components) {
            if (!components[element]) {
                return false;
            }
        }
        return true;
    }) || materials[0];
}

async function p1_make() {
    // FIXME: ここに上がるための元素を選択するコードを実装（相手の元素の読みなどを含めて）

    // TODO: とりあえず最もポイントが高い元素を利用する / from AI.js
    const makeable_material = await search_materials(arrayToObj(p1_hand));

    // 作れる物質がない場合は "なし" を返す
    if (!makeable_material || makeable_material.length === 0) {
        return [{
            "name": "なし",
            "formula": "なし",
            "point": 0,
            "components": {},
            "advantageous": [],
            "number": 0
        }];
    }

    // ポイントが高い順にソート
    makeable_material.sort((a, b) => b.point - a.point);

    return makeable_material;
}

async function p2_make() {
    // ボタンの表示を変更
    document.getElementById("generate_button").style.display = "none";
    const button = document.getElementById("done_button");
    button.style.display = "inline";

    // 以前のイベントリスナーを削除して新しく作成
    button.replaceWith(button.cloneNode(true));
    const newButton = document.getElementById("done_button");

    // ボタンクリックを待機
    return new Promise((resolve) => {
        newButton.addEventListener("click", function () {
            const newButton = document.getElementById("done_button");
            newButton.style.display = "none";
            const p2_make_material = search(arrayToObj(p2_selected_card));
            resolve(p2_make_material);
            finishSelect();
        }, { once: true }); // 一度だけ実行されるようにする
    });
}



async function get_dora() {
    return element[Math.round(Math.random()*23)]
}

let p1_finish_select = true
let p2_finish_select = true
let p1_make_material = {}
async function done(who, isRon = false) {
    const p2_make_material = await p2_make();
    while (p1_finish_select || p2_finish_select) {}
    console.log("next process")
    if (name === "p2"){finish_done_select(p1_make_material,p2_make_material,who,isRon=isRon)}
}




async function finish_done_select(p1_make_material,p2_make_material,who,isRon=false) {
    dora = await get_dora();
    console.log(`ドラ: ${dora}`);
    console.log(p1_make_material)
    console.log(p2_make_material)
    
    let thisGame_p2_point = p2_make_material.point;
    let thisGame_p1_point = p1_make_material.point;

    // 有利な生成物の場合のボーナス
    if (Boolean(p2_make_material.advantageous.includes(p1_make_material.formula))) {
        thisGame_p2_point *= (1.5 + Math.random() / 2);
    } else if (Boolean(p1_make_material.advantageous.includes(p2_make_material.formula))) {
        thisGame_p1_point *= (1.5 + Math.random() / 2);
    }

    // 役の中にドラが含まれる場合のボーナス
    if (Boolean(Object.keys(p2_make_material.components).includes(dora))) {
        thisGame_p2_point *= 1.5;
    } else if (Boolean(Object.keys(p1_make_material.components).includes(dora))) {
        thisGame_p1_point *= 1.5;
    }

    // **ロン時のボーナス**
    if (isRon) {
        who == "p2" ? thisGame_p2_point /= 1.2 : thisGame_p1_point /= 1.2
    }

    who == "p2" ? thisGame_p1_point /= 1.5 : thisGame_p2_point /= 1.5;

    // 小数点以下を四捨五入
    thisGame_p2_point = Math.round(thisGame_p2_point);
    thisGame_p1_point = Math.round(thisGame_p1_point);

    // 得点を更新
    p1_point += await thisGame_p1_point;
    p2_point += await thisGame_p2_point;

    // 画面に反映
    document.getElementById("p2_point").innerHTML += `+${thisGame_p2_point}`;
    document.getElementById("p1_point").innerHTML += `+${thisGame_p1_point}`;
    document.getElementById("p2_explain").innerHTML = `生成物質：${p2_make_material.name}, 組成式：${p2_make_material.formula}`;
    document.getElementById("p1_explain").innerHTML = `生成物質：${p1_make_material.name}, 組成式：${p1_make_material.formula}`;

    //updateGeneratedMaterials(p2_make_material.name); //ここは、もしかしたらAI作成に使えるかも
    sharePoints()

    winnerAndChangeButton()
}

async function winnerAndChangeButton() {
    const winner = await win_check();
    
    document.getElementById("done_button").style.display = "none";
    const button = document.getElementById("nextButton");
    button.style.display = "inline";
    console.log("ゲーム終了");
    button.textContent = "ラウンド終了";
    button.addEventListener("click", function () {
        returnToStartScreen()
        p1_point = 0;
        p2_point = 0;
        numTurn = 0;
        resetGame();
        button.style.display = "none"
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        conn.close()
    });
}



async function win_check() {
    return Math.abs(p1_point - p2_point) >= WIN_POINT ? p1_point>p2_point ? "p1": "p2" : numTurn >= WIN_TURN ? p1_point>p2_point ? "p1": "p2" : null
}

async function p1_exchange(targetElem) {
    // Select a random card index from p1_hand// TODO: from AI.js
    dropped_cards_p1.push(p1_hand[targetElem])
    var exchange_element = p1_hand[targetElem]
    // Ensure the target card exists and is valid
    if (!p1_hand[targetElem]) {
        console.error("Invalid target element in p1_hand.")
        return
    }
    // Create a new image for the dropped card area
    const newImg = document.createElement("img")
    newImg.src = imageCache[elementToNumber[p1_hand[targetElem]]].src
    newImg.style.border = "1px solid #000"
    document.getElementById("dropped_area_p1").appendChild(newImg)
    // Update the player's hand with a new element
    const img = document.querySelectorAll("#p1_hand img")[targetElem]
    if (!img) {
        console.error("Image element not found in p1_hand.")
        return
    }
    // Select a new random element and replace the target card
    const newElem = drawCard()
    p1_hand[targetElem] = newElem
    // Update the image element's appearance
    img.src = imageCache[0].src
    img.alt = newElem
    img.style.padding = "5px"
    img.style.border = "1px solid #000"
    // Remove and reapply the 'selected' class to reset the state
    img.classList.remove("selected")
    img.classList.add("selected")
    // Switch the turn to "p1"
    turn = (turn == "p2") ? "p1" : "p2";
    console.log("p1_exchange()")
    changeTurn(turn)
    checkRon(exchange_element);
}

async function p1_action() {
    if (turn == name) {return}
    console.log("p1_action()")
}



//便利系関数
function arrayToObj(array) {
    let result = {}
    array.forEach(item => {
        if (result[item]) {
            result[item]++
        } else {
            result[item] = 1
        }
    })
    return result
}
function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array
}
function drawCard() {
    return deck.length > 0 ? deck.pop() : (time = "make", done("no-draw"));
}
async function search_materials(components) {
    return materials.filter(material => {
        for (const element in material.components) {
            if (!components[element] || material.components[element] > components[element]) {
                return false
            }
        }
        return true
    })
}
function random_hand() {
    for (let i = 0; i < card_num; i++) {
        p1_hand.push(drawCard())
        p2_hand.push(drawCard())
    }
}

const generate_Button = document.getElementById("generate_button")
generate_Button.addEventListener("click", function () {
    if (turn === name) {
        time = "make";
        p2_make()
        generate_Button.value = "これでアガる"
        shareAction(action="generate",otherData=name)
    }
});


function resetGame() {
    p1_hand = [];
    p2_hand = [];
    dropped_cards_p1 = [];
    dropped_cards_p2 = [];
    p1_selected_card = [];
    p2_selected_card = [];
    time = "game";
    turn = Math.random() <= 0.5 ? "p1" : "p2";
    numTurn = 1;  // ターンカウントをリセット

    document.getElementById("p1_point").innerHTML = `ポイント：${p1_point}`;
    document.getElementById("p1_explain").innerHTML = "　";
    document.getElementById("p2_point").innerHTML = `ポイント：${p2_point}`;
    document.getElementById("p2_explain").innerHTML = "　";

    document.getElementById("generate_button").style.display = "inline";
    document.getElementById("done_button").style.display = "none";
    document.getElementById("nextButton").style.display = "none";

    deck = [...elements, ...elements];
    deck = shuffle(deck);

    const p1_hand_element = document.getElementById("p1_hand");
    const p2_hand_element = document.getElementById("p2_hand");
    p1_hand_element.innerHTML = "";
    p2_hand_element.innerHTML = "";

    const dropped_area_p1_element = document.getElementById("dropped_area_p1");
    const dropped_area_p2_element = document.getElementById("dropped_area_p2");
    dropped_area_p1_element.innerHTML = "";
    dropped_area_p2_element.innerHTML = "";

    random_hand();
    view_p1_hand();
    view_p2_hand();

    if (turn !== name) {
        setTimeout(() => p1_action(), 500);
    }
}

function preloadImages() {
    let imageNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 29, 30, 53];

    imageNumbers.forEach(num => {
        let img = new Image();
        img.src = `../images/${num}.webp`;
        imageCache[num] = img;
    });
}

async function init_json() {
    materials = await loadMaterials()
}



async function checkRon(droppedCard) {
    // P2のロン判定
    const possibleMaterialsP2 = await search_materials(arrayToObj([...p2_hand, droppedCard]));
    if (possibleMaterialsP2.length > 0) {
        const ronButton = document.getElementById("ron_button");
        ronButton.style.display = "inline";
        ronButton.replaceWith(ronButton.cloneNode(true));
        const newRonButton = document.getElementById("ron_button");

        newRonButton.addEventListener("click", function () {
            newRonButton.style.display = "none";
            p2_selected_card = [droppedCard];
            time = "make";
            done("p2", true);
        });
    }
}

function updateGeneratedMaterials(materialName) {
    if (!materialName || materialName === "なし") return;

    // LocalStorage からデータを取得（なければ空のオブジェクト）
    let generatedMaterials = JSON.parse(localStorage.getItem("generatedMaterials")) || {};

    // 物質のカウントを更新
    if (generatedMaterials[materialName]) {
        generatedMaterials[materialName] += 1;
    } else {
        generatedMaterials[materialName] = 1;
    }

    // LocalStorage に保存
    localStorage.setItem("generatedMaterials", JSON.stringify(generatedMaterials));
}

document.addEventListener('DOMContentLoaded', function () {
    preloadImages()
    init_json()
    deck = [...elements, ...elements]
    deck = shuffle(deck)
    random_hand()
    view_p1_hand()
    view_p2_hand()
    turn = Math.random()>=0.5 ? "p1" : "p2"
    if (turn != name) {p1_action()}
})


//変える必要がない関数たち
function returnToStartScreen() {
    document.getElementById("startScreen").style.display = "flex";
    document.getElementById("p1_area").style.display = "none";
    document.getElementById("dropped_area_p1").style.display = "none";
    document.getElementById("dropped_area_p2").style.display = "none";
    document.getElementById("p2_area").style.display = "none";
    document.getElementById("gameRuleButton").style.display = "block";
}

function startGame() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("p1_area").style.display = "block";
    document.getElementById("dropped_area_p1").style.display = "block";
    document.getElementById("dropped_area_p2").style.display = "block";
    document.getElementById("p2_area").style.display = "block";
    document.getElementById("gameRuleButton").style.display = "none";
}

function showRules() {
    document.getElementById("rulesModal").style.display = "block";
}

function closeRules() {
    document.getElementById("rulesModal").style.display = "none";
}

document.getElementById("closeRulesButton").addEventListener("click", closeRules);

// モーダル外をクリックした場合に閉じる
window.onclick = function(event) {
    const modal = document.getElementById("rulesModal");
    if (event.target === modal) {
        closeRules();
    }
};

//設定画面
function openWinSettings() {
    document.getElementById("winSettingsModal").style.display = "block";
}
function saveWinSettings() {
    let winPointInput = parseInt(document.getElementById("winPointInput").value, 10);
    let winTurnInput = parseInt(document.getElementById("winTurnInput").value, 10);

    if (isNaN(winPointInput) || winPointInput < 1) {
        alert("WIN_POINT は 1 以上の数値を入力してください。");
        return;
    }
    if (isNaN(winPointInput) || winPointInput > 999) {
        alert("WIN_POINT の最大値は 999 です。");
        return;
    }
    if (isNaN(winTurnInput) || winTurnInput < 1) {
        alert("WIN_TURN は 1 以上の数値を入力してください。");
        return;
    }

    WIN_POINT = winPointInput;
    WIN_TURN = winTurnInput;
    closeWinSettings();
}
function closeWinSettings() {
    document.getElementById("winSettingsModal").style.display = "none";
}
document.getElementById("setting_icon").addEventListener("click", function() {
    document.getElementById("winSettingsModal").style.display = "inline"
})

const roomName = prompt("設定するIDを入力してください（半角）");
var utf8_RoomName = unescape(encodeURIComponent(roomName));
const peer = new Peer(utf8_RoomName); // 合言葉をそのままPeer IDとして使う
let conn;
let name = null; // null = 未確定, "p1" = ホスト, "p2" = ゲスト

peer.on('open', id => {
    document.getElementById('my-id').innerText = `自分のPeerID：${id}`;
    document.getElementById("winSettingsModal").style.display = "none"
});

peer.on('connection', connection => {
    conn = connection;
    if (name === null) {
        name = "p2"; // 後から接続した側は p2
        console.log("✅ あなたはゲスト (p2) になりました！");
        document.getElementById("winSettingsModal").style.display = "none"
    }
    setupConnection();
});

function connectToPeer() {
    if (name === null) {
        name = "p1"; // 最初に接続する側を p1 に
        console.log("✅ あなたはホスト (p1) になりました！");
        document.getElementById("winSettingsModal").style.display = "none"
    }
    const remoteId = document.getElementById('remote-id').value;
    conn = peer.connect(remoteId);
    setupConnection();
}

function setupConnection() {
    conn.on('open', () => {
        console.log('🔗 接続しました！');
        if (name === "p1") {
            conn.send({ type: "role", value: "p2" }); // ゲストに "p2" であることを通知
            conn.send({ type: "turn", value: turn }); // 現在のターンを送信
        }
        shareVariable();
        startGame();
    });

    conn.on('data', data => {
        console.log("📩 受信データ:", data);
        if (data.type === "role" && name === null) {
            name = data.value;
            console.log(`✅ あなたは ${name} になりました！`);
        }
        if (data.type === "turn") {
            turn = data.value;
            console.log(`🔄 ターン更新: ${turn}`);
        }
        if (data.type === "action") {
            if (data.action == "exchange") {
                deck = data.deck
                dropped_cards_p1.push(data.otherData)
                const img = document.createElement("img")
                img.alt = data.otherData
                img.src = imageCache[elementToNumber[data.otherData]].src
                img.style.border = "1px solid #000"
                document.getElementById("dropped_area_p1").appendChild(img)
            } else if (data.action == "generate") {time = "make";done(who=data.otherData)}
        }
        if (data.type === "selected") {
            p1_finish_select = false
            p1_make_material = data.otherData
            console.log(data.otherData)
            done(name=="p1" ? "p2":"p1")
        }
        if (data.type === "pointsData") {
            p1_point = data.p1_point
            p2_point = data.p2_point
            document.getElementById("p1_point").innerHTML += `+${data.p1_point}`
            document.getElementById("p2_point").innerHTML += `+${data.p2_point}`
            document.getElementById("p1_explain").innerHTML = data.p1_explain
            document.getElementById("p2_explain").innerHTML = data.p2_explain
            winnerAndChangeButton()
        }
        if (data.p1_hand !== undefined) p1_hand = data.p1_hand;
        if (data.deck !== undefined) deck = data.deck;
    });
}

function shareVariable() {
    if (conn && conn.open) {
        if (name === "p1") {
            console.log("📤 ホスト (p1) として変数送信！");
            conn.send({ p1_hand: p2_hand, deck: deck, turn: turn });
        } else {
            console.log("📤 ゲスト (p2) として変数送信！");
            conn.send({ p1_hand: p2_hand });
        }
    } else {
        console.log("⚠️ 接続が開かれていません！");
    }
}

function shareAction(action, otherData) {
    if (conn && conn.open) {
        conn.send({ type: "action",action: action, otherData: otherData, deck: deck});
    }
}

function changeTurn(newTurn) {
    console.log(`🔄 ターン変更: ${newTurn}`);
    if (conn && conn.open) {
        conn.send({ type: "turn", value: newTurn });
    }
}

async function finishSelect() {
    console.log(`${name}は選択が完了`);
    if (conn && conn.open) {
        p2_make_material = await search(arrayToObj(p2_selected_card))
        conn.send({ type: "selected", value: name, otherData: p2_make_material});
        p2_finish_select = false
    }
}

async function sharePoints() {
    if (conn && conn.open) {
        p1_explain_copy = document.getElementById("p2_explain").textContent
        p2_explain_copy = document.getElementById("p1_explain").textContent
        console.log(p1_explain_copy)
        console.log(p2_explain_copy)
        conn.send({type: "pointsData", p1_point: p2_point, p1_explain: p1_explain_copy, p2_point: p1_point, p2_explain: p2_explain_copy})
    }
}
