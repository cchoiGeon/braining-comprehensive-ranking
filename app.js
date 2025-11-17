// A/B/C 게임 코드 (Normal 난이도)
const GAME_CODES = {
    A: 10102, // 기억력
    B: 30102, // 문제해결력
    C: 20102  // 집중력
};

let timerInterval = null;
let remainingSec = 0;

/* ============================
   MOCK RANKING DATA (예시)
============================ */
const MOCK_DATA = {
    A: [
        { nickname: "MemoryKing", top: 520 },
        { nickname: "BlueFox", top: 510 },
        { nickname: "Nero", top: 495 },
        { nickname: "Sunny", top: 480 },
        { nickname: "ZeroOne", top: 470 },
        { nickname: "MintLeaf", top: 455 },
        { nickname: "Nova", top: 440 }
    ],
    B: [
        { nickname: "LogicMaster", top: 630 },
        { nickname: "Nero", top: 610 },
        { nickname: "BlueFox", top: 590 },
        { nickname: "ZeroOne", top: 585 },
        { nickname: "Sunny", top: 570 },
        { nickname: "AIplayer", top: 565 },
        { nickname: "MintLeaf", top: 550 }
    ],
    C: [
        { nickname: "Nova", top: 710 },
        { nickname: "BlueFox", top: 700 },
        { nickname: "MemoryKing", top: 690 },
        { nickname: "Sunny", top: 680 },
        { nickname: "Nero", top: 670 },
        { nickname: "AIplayer", top: 660 },
        { nickname: "ZeroOne", top: 645 }
    ]
};

/* ============================
   기간 선택 UI 초기화
============================ */
const pickerConfig = [
    {
        inputId: "dateInput",
        displayId: "dateDisplay",
        formatter: formatDateDisplay,
        placeholder: "날짜 선택"
    },
    {
        inputId: "startTimeInput",
        displayId: "startDisplay",
        formatter: formatTimeDisplay,
        placeholder: "시작 시간 선택"
    },
    {
        inputId: "endTimeInput",
        displayId: "endDisplay",
        formatter: formatTimeDisplay,
        placeholder: "종료 시간 선택"
    }
];

pickerConfig.forEach(({ inputId, displayId, formatter, placeholder }) => {
    const input = document.getElementById(inputId);
    const button = document.querySelector(`.picker-button[data-input="${inputId}"]`);
    const display = document.getElementById(displayId);

    const updateDisplay = () => {
        display.textContent = input.value ? formatter(input.value) : placeholder;
    };

    button.addEventListener("click", () => {
        if (input.showPicker) {
            input.showPicker();
        } else {
            input.focus();
        }
    });

    input.addEventListener("change", updateDisplay);
    updateDisplay();
});

/* ============================
   시간 설정 적용
============================ */
document.getElementById("applyTimeBtn").addEventListener("click", () => {
    const btn = document.getElementById("applyTimeBtn");

    const date = document.getElementById("dateInput").value;
    const start = document.getElementById("startTimeInput").value;
    const end = document.getElementById("endTimeInput").value;

    if (!date || !start || !end) return alert("시간을 모두 입력해주세요.");

    const startDate = new Date(`${date}T${start}:00`);
    const endDate = new Date(`${date}T${end}:00`);

    remainingSec = Math.floor((endDate - startDate) / 1000);
    if (remainingSec <= 0) return alert("종료 시간이 시작 시간보다 뒤여야 합니다.");

    // 버튼 로딩 및 비활성화
    btn.classList.add("loading");
    btn.classList.add("disabled");
    btn.disabled = true;

    // 타이머 시작
    startTimer();

    // 랭킹 호출 시작
    fetchAllRankings(startDate, endDate);

    // 0.8초 후 로딩 종료
    setTimeout(() => {
        btn.classList.remove("loading");
    }, 800);
});

/* ============================
   타이머 동작
============================ */
function startTimer() {
    clearInterval(timerInterval);
    updateTimerUI();

    timerInterval = setInterval(() => {
        remainingSec--;
        if (remainingSec < 0) {
            clearInterval(timerInterval);
            return;
        }
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const h = String(Math.floor(remainingSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, "0");
    const s = String(remainingSec % 60).padStart(2, "0");

    document.getElementById("timerText").textContent = `${h}:${m}:${s}`;

    const max = 60 * 60 * 100; // 100시간 기준 대략적 퍼센트
    const percent = remainingSec / max;
    const offset = 628 * (1 - percent);

    document.querySelector("circle.progress").style.strokeDashoffset = offset;
}

/* ============================
   MOCK fetchRank
============================ */
async function mockFetchRank(code) {
    if (code === GAME_CODES.A) return MOCK_DATA.A;
    if (code === GAME_CODES.B) return MOCK_DATA.B;
    if (code === GAME_CODES.C) return MOCK_DATA.C;
    return [];
}

/* ============================
   API 5초마다 호출
============================ */
async function fetchAllRankings(start, end) {

    async function load() {
        const A = await mockFetchRank(GAME_CODES.A);
        const B = await mockFetchRank(GAME_CODES.B);
        const C = await mockFetchRank(GAME_CODES.C);

        renderRankList("A", A);
        renderRankList("B", B);
        renderRankList("C", C);

        renderTotalRanking(A, B, C);
    }

    await load();
    setInterval(load, 5000);
}

/* ============================
   게임별 1~7위 표시
============================ */
function renderRankList(key, list) {
    const ul = document.getElementById(`rank${key}List`);
    ul.innerHTML = "";

    list.slice(0, 7).forEach((u, i) => {
        const li = document.createElement("li");
        li.classList.toggle("top-rank", i < 3);
        li.innerHTML = `
            <div class="rank-badge">${i + 1}</div>
            <div class="rank-info">
                <strong>${u.nickname}</strong>
                <span>${key} 게임</span>
            </div>
            <span class="rank-score">${u.top}점</span>
        `;
        ul.appendChild(li);
    });
}

/* ============================
   종합 랭킹 계산
============================ */
function renderTotalRanking(A, B, C) {
    const scores = {};

    const addScore = (list) => {
        list.slice(0, 7).forEach((u, i) => {
            const score = 8 - (i + 1); // 1위 = 7점
            scores[u.nickname] = (scores[u.nickname] || 0) + score;
        });
    };

    addScore(A);
    addScore(B);
    addScore(C);

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    const ul = document.getElementById("totalRankList");
    ul.innerHTML = "";

    sorted.forEach(([nick, score], i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${i + 1}위</span>
            <span>${nick}</span>
            <span>${score}점</span>
        `;
        ul.appendChild(li);
    });
}

/* ============================
   종합 랭킹 드롭다운
============================ */
document.getElementById("toggleTotalRanking").addEventListener("click", () => {
    document.getElementById("totalRankingPanel").classList.toggle("hidden");
});

/* ============================
   Formatter helpers
============================ */
function formatDateDisplay(value) {
    if (!value) return "날짜 선택";
    const [y, m, d] = value.split("-");
    return `${y}. ${m}. ${d}.`;
}

function formatTimeDisplay(value) {
    if (!value) return "시간 선택";
    const [hour, minute] = value.split(":");
    const hourNum = Number(hour);
    const period = hourNum >= 12 ? "오후" : "오전";
    let displayHour = hourNum % 12;
    displayHour = displayHour === 0 ? 12 : displayHour;
    return `${period} ${String(displayHour).padStart(2, "0")}:${minute}`;
}
