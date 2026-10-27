# ONDO Office

문서·일정·할 일을 한곳에서 관리하는 한국어 개인 업무 대시보드입니다.

- 대시보드: 오늘 마감·기한 지난 업무, 일정, 최근 문서, 업무 달성률
- 할 일: 추가·수정·삭제·완료 처리, 우선순위와 마감일, 상태별 필터
- 일정: 월간 캘린더, 날짜별 일정 등록·수정·삭제
- 문서: 작성·수정·삭제·분류, 제목·본문 검색
- 통합 검색, 브라우저 저장, JSON 백업, 모바일 하단 메뉴
- 기본 업무 브리핑: 현재 데이터를 바탕으로 브라우저에서 계산

처음 표시되는 항목은 사용법을 위한 예시입니다. 데이터는 현재 브라우저의 localStorage에 저장됩니다. 로그인, 다중 사용자, 기기 간 동기화, 외부 캘린더 연결은 포함되지 않습니다. 브라우저 데이터 삭제 전 JSON 백업을 다운로드하세요. JSON 백업 복원 UI는 아직 없습니다.

AI 어시스턴트 화면은 준비되어 있지만 실제 생성형 AI 연동은 비활성화 상태입니다. `/api/assistant`는 연결 전 상태를 반환하며 외부 AI 서비스를 호출하지 않습니다. 업무 정보의 외부 전송에 대한 사용자 동의를 받은 후 AI Gateway를 연동해야 합니다. 기본 업무 브리핑은 AI 호출 없이 사용할 수 있습니다.

## 로컬 실행

Node.js 22 이상. 별도 런타임 패키지 설치가 필요하지 않습니다.

```sh
npm run dev
npm test
npm run build
```

개발 주소: http://localhost:3000

## GitHub 및 Vercel

- 저장소: https://github.com/kglim1011-wq/ai_edu
- 브랜치: `main`
- Vercel 팀: `aiedu-1011`
- Vercel 프로젝트: `ondo-ai-office`
- Framework: Other
- Build: `node scripts/build.mjs`
- Output: `dist`
- API: `api/assistant.mjs` (Node.js Function)

완료한 작업은 검증 후 커밋·푸시합니다. 작업 규칙은 `AGENTS.md`를 참고하세요. `.vercel/`, `.env*`, 빌드 산출물은 저장소에서 제외됩니다. Git 연동이 완료되면 `main` 푸시가 운영 배포를 실행합니다.

공식 배포 문서: https://vercel.com/docs/git/vercel-for-github
