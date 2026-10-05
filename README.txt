말의 기술 — HTML / CSS / JavaScript 분리 파일

실행 방법
  ZIP을 압축 해제한 다음 index.html을 더블클릭하세요.
  머리 데이터를 파일에 포함해 웹서버 없이도 초상을 열 수 있게 수정했습니다.
  모든 파일을 같은 폴더에 유지해 주세요. 특히 head-data.js가 필요합니다.
  훈련 화면의 외부 CSS와 아이콘, 화자 이미지는 인터넷 연결이 필요합니다.

HTML: index.html (메인), trainer.html (훈련)
CSS: style.css (메인), trainer.css (훈련)
JavaScript: app.js (회전·클릭), head-data.js (머리 데이터),
            trainer.js (훈련 기능), tailwind.config.js (훈련 스타일 설정)
기타: favicon.svg, credits.txt (3D 모델 원작·라이선스)

기존 head.bin은 더 이상 초상을 불러오는 데 사용하지 않습니다.

귀 / 대화: conversation-data.js에 대사와 분기, conversation.js에 진행 및 ASCII 파형, conversation.css에 시각 연출을 분리했습니다. AI API 없이 동작합니다.
