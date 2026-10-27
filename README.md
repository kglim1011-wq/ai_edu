# ONDO PC Office

문서·일정·할 일을 관리하고, 이 PC에 로그인된 Codex를 통해 AI와 대화하는 한국어 개인 업무 오피스입니다.

- 대시보드: 오늘 마감·기한 지난 업무, 일정, 최근 문서, 업무 달성률
- 할 일: 추가·수정·삭제·완료 처리, 우선순위와 마감일, 상태별 필터
- 일정: 월간 캘린더, 날짜별 일정 등록·수정·삭제
- 문서: 작성·수정·삭제·분류, 제목·본문 검색
- 통합 검색, 브라우저 저장, JSON 백업, 모바일 하단 메뉴
- 기본 업무 브리핑: 현재 데이터를 바탕으로 브라우저에서 계산

처음 표시되는 항목은 사용법을 위한 예시입니다. PC 버전의 업무 데이터는 `.local/office.json`에 저장되고 직전 저장본은 `.local/office.json.previous`에 남습니다. 이 폴더는 GitHub와 Vercel 업로드에서 제외됩니다. 다중 사용자, 기기 간 동기화, 외부 캘린더 연결은 포함되지 않습니다. 워크스페이스 정보에서 JSON 백업을 가져오거나 내려받을 수 있습니다.

## PC에서 시작하기

1. Node.js 22 이상과 Codex 데스크톱 앱이 설치돼 있어야 합니다.
2. Codex에서 **ChatGPT로 로그인**합니다. API 키 로그인은 사용하지 않습니다.
3. 이 폴더의 **AI오피스 실행.cmd**를 더블클릭합니다.
4. 브라우저에서 http://localhost:3000 주소가 열립니다.
5. AI 어시스턴트에서 요청하면 기존 Codex 요금제의 사용량을 사용합니다.

종료하려면 **AI오피스 종료.cmd**를 실행하세요. PC를 다시 켠 뒤에는 실행 파일을 다시 열면 됩니다. 서버는 이 PC의 루프백 주소에서만 열립니다. 자동 시작이나 외부 공개 설정은 추가하지 않습니다.

### AI 사용량과 데이터

- 로컬 서버는 공식 `codex exec`를 호출하며 현재 ChatGPT 로그인 상태를 요청마다 확인합니다. 사용자 설정과 API 키 환경 변수를 넘기지 않고 ChatGPT 인증만 허용합니다.
- Vercel AI Gateway, Gemini, OpenAI API 키를 사용하지 않으며 API 키 과금으로 자동 전환하지 않습니다.
- 기존 Codex 요금제의 사용 한도 및 계정의 크레딧 정책이 적용됩니다. 이 앱이 별도 크레딧 구매나 자동 충전을 실행하지는 않습니다.
- AI 요청에는 할 일 제목·마감일·우선순위·완료 여부, 일정 제목·날짜·시간, 문서 제목·분류, 입력한 요청과 최근 3회 대화가 OpenAI로 전달됩니다. 문서 본문은 제외합니다.
- 대화는 페이지가 열린 동안 메모리에만 유지됩니다. Codex 호출도 ephemeral 모드로 실행합니다. 토큰은 읽거나 복사하거나 웹페이지에 전달하지 않습니다.
- 오피스 AI에서 셸, 앱 플러그인, 브라우저, 컴퓨터 제어 도구를 비활성화하고 읽기 전용 샌드박스를 사용합니다. 업무 데이터 변경은 화면에서 직접 수행합니다.
- 기본 업무 브리핑은 PC 안에서 계산되며 AI 사용량을 쓰지 않습니다. 생성형 AI 대화에는 인터넷 연결이 필요합니다.

기존 웹 버전 데이터는 Vercel 사이트의 **데이터 백업**으로 내려받고, PC 버전의 **워크스페이스 정보 → 백업 가져오기**에서 복원하세요. 같은 localhost 주소의 이전 브라우저 데이터가 있고 PC 저장 파일이 없는 첫 실행에는 해당 데이터를 가져옵니다.

공식 문서: https://learn.chatgpt.com/docs/auth · https://learn.chatgpt.com/docs/non-interactive-mode

## 로컬 실행

Node.js 22 이상. 별도 런타임 패키지 설치가 필요하지 않습니다.

```sh
npm run dev
npm start
npm stop
npm test
npm run build
```

`npm start`는 서버를 백그라운드에서 실행하고 Windows 기본 브라우저를 엽니다. `npm run dev`는 터미널에서 서버를 실행합니다. 포트를 바꾸려면 `ONDO_PORT` 환경 변수를 지정하세요.

## GitHub 및 Vercel

- 저장소: https://github.com/kglim1011-wq/ai_edu
- 브랜치: `main`
- Vercel 팀: `aiedu-1011`
- Vercel 프로젝트: `ondo-ai-office`
- Framework: Other
- Build: `node scripts/build.mjs`
- Output: `dist`
- API: `api/assistant.mjs` (Node.js Function)

Vercel 사이트는 화면 미리보기용 웹 버전입니다. 웹 버전에서는 PC의 Codex 로그인과 로컬 서버에 접근하지 않으며 AI 요청도 실행하지 않습니다. PC 전용 서버 코드는 `scripts/local-server.mjs`와 `scripts/codex-bridge.mjs`입니다.

완료한 작업은 검증 후 커밋·푸시합니다. 작업 규칙은 `AGENTS.md`를 참고하세요. `.vercel/`, `.env*`, 빌드 산출물은 저장소에서 제외됩니다. Git 연동이 완료되면 `main` 푸시가 운영 배포를 실행합니다.

공식 배포 문서: https://vercel.com/docs/git/vercel-for-github
