const gloveSets={white:['white-1.jpg','white-2.jpg','white-3.jpg','white-4.jpg','white-5.jpg'],black:['black-1.jpg','black-2.jpg','black-3.jpg','black-4.jpg','black-5.jpg']};
let gloveColor='white',gloveIndex=0;
const gloveImage=document.querySelector('#glove-image');
function showGlove(){const list=gloveSets[gloveColor];gloveIndex=(gloveIndex+list.length)%list.length;gloveImage.src=`assets/gloves/${list[gloveIndex]}`;gloveImage.alt=currentLang==='en'?`${gloveColor==='white'?'White':'Black'} golf glove, photo ${gloveIndex+1}`:`${gloveColor==='white'?'화이트':'블랙'} 골프 장갑 사진 ${gloveIndex+1}`;document.querySelector('#counter').textContent=`${String(gloveIndex+1).padStart(2,'0')} / 05`}
function moveGlove(n){gloveIndex+=n;showGlove()}
document.querySelector('#prev').onclick=()=>moveGlove(-1);document.querySelector('#next').onclick=()=>moveGlove(1);document.querySelector('#shop-prev').onclick=()=>moveGlove(-1);document.querySelector('#shop-next').onclick=()=>moveGlove(1);
document.querySelectorAll('.colors button').forEach(button=>button.addEventListener('click',()=>{gloveColor=button.dataset.color;gloveIndex=0;document.querySelectorAll('.colors button').forEach(b=>b.classList.toggle('selected',b===button));document.querySelector('#color-name').textContent=`${translations[currentLang].color}${gloveColor==='white'?translations[currentLang].white:translations[currentLang].black}`;document.querySelector('#buy').href=gloveColor==='white'?'https://naver.me/xPYzBGC9':'https://naver.me/GfrQPgTP';showGlove()}));
const rates=[...document.querySelectorAll('[data-rate]')];let rating=0;const labels=['','아쉬워요','보통이에요','괜찮아요','만족스러워요','정말 만족해요'];
rates.forEach(button=>button.addEventListener('click',()=>{rating=Number(button.dataset.rate);rates.forEach(star=>star.classList.toggle('active',Number(star.dataset.rate)<=rating));document.querySelector('#rate-label').textContent=translations[currentLang].rating[rating]}));
const reviewDB=new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('후기 저장 미지원'));return}const open=indexedDB.open('kobada-lesson-reviews',1);open.onupgradeneeded=()=>open.result.createObjectStore('reviews',{keyPath:'id'});open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error)});
function dbRequest(mode,operation){return reviewDB.then(db=>new Promise((resolve,reject)=>{const req=operation(db.transaction('reviews',mode).objectStore('reviews'));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}))}
async function removeDuplicateReviews(reviews){
  const seen=new Set(),duplicates=[];
  // Keep the oldest copy so the two newest repeated entries disappear from the top of the list.
  for(const review of [...reviews].sort((a,b)=>a.createdAt-b.createdAt)){
    const signature=JSON.stringify([review.rating,review.name||'',review.kind||'',review.message||'',(review.files||[]).map(file=>[file.name||'',file.type||'',file.blob?.size||0])]);
    if(seen.has(signature))duplicates.push(review.id);else seen.add(signature);
  }
  if(!duplicates.length)return reviews;
  const db=await reviewDB;
  await new Promise((resolve,reject)=>{const tx=db.transaction('reviews','readwrite'),store=tx.objectStore('reviews');duplicates.forEach(id=>store.delete(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
  return reviews.filter(review=>!duplicates.includes(review.id));
}
const fileInput = document.querySelector('#media');
const preview = document.querySelector('#previews');
const uploadDrop = document.querySelector('#upload-drop');
const uploadCount = document.querySelector('#upload-count');
const statusText = document.querySelector('#status');
const previewUrls = new WeakMap();
const MAX_FILES = 5;
const MAX_FILE_SIZE = 30 * 1024 * 1024;
const MAX_TOTAL_SIZE = 80 * 1024 * 1024;
let uploads = [];

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getPreviewUrl(file) {
  if (!previewUrls.has(file)) previewUrls.set(file, URL.createObjectURL(file));
  return previewUrls.get(file);
}

function fileKind(file) {
  const type = file.type.toLowerCase();
  const extension = file.name.split('.').pop().toLowerCase();
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'].includes(extension)) return 'photo';
  if (type.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', '3gp'].includes(extension)) return 'video';
  return null;
}

function makePreview(file) {
  const kind = fileKind(file);
  const card = document.createElement('article');
  card.className = 'upload-card';
  const visual = document.createElement('div');
  visual.className = 'upload-card-visual';
  const canPreviewImage = kind === 'photo' && !/\.hei[cf]$/i.test(file.name);
  if (canPreviewImage) {
    const image = document.createElement('img');
    image.alt = '';
    image.src = getPreviewUrl(file);
    image.addEventListener('error', () => {
      visual.replaceChildren();
      visual.classList.add('file-placeholder');
      visual.textContent = currentLang === 'en' ? 'PHOTO' : 'PHOTO';
    }, { once: true });
    visual.append(image);
  } else {
    visual.classList.add('file-placeholder');
    visual.textContent = kind === 'video' ? 'VIDEO' : 'PHOTO';
  }
  const details = document.createElement('div');
  details.className = 'upload-card-details';
  const filename = document.createElement('strong');
  filename.textContent = file.name;
  filename.title = file.name;
  const metadata = document.createElement('small');
  metadata.textContent = `${kind === 'video' ? translations[currentLang].video : translations[currentLang].photo} · ${formatBytes(file.size)}`;
  details.append(filename, metadata);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'upload-remove';
  remove.setAttribute('aria-label', currentLang === 'en' ? `Remove ${file.name}` : `${file.name} 첨부 삭제`);
  remove.textContent = '×';
  remove.addEventListener('click', () => {
    const position = uploads.indexOf(file);
    if (position !== -1) uploads.splice(position, 1);
    const url = previewUrls.get(file);
    if (url) URL.revokeObjectURL(url);
    renderUploads();
  });
  card.append(visual, details, remove);
  return card;
}

function renderUploads() {
  preview.replaceChildren(...uploads.map(makePreview));
  uploadCount.textContent = `${uploads.length} / ${MAX_FILES}`;
  uploadDrop.classList.toggle('is-full', uploads.length >= MAX_FILES);
}

function addFiles(fileList) {
  let added = 0;
  const rejected = [];
  for (const file of [...fileList]) {
    if (uploads.length >= MAX_FILES) {
      rejected.push(translations[currentLang].errors.maxFiles);
      break;
    }
    if (!fileKind(file)) {
      rejected.push(`${file.name}: ${translations[currentLang].errors.photoVideo}`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push(`${file.name}: ${translations[currentLang].errors.eachLimit}`);
      continue;
    }
    const total = uploads.reduce((sum, item) => sum + item.size, 0);
    if (total + file.size > MAX_TOTAL_SIZE) {
      rejected.push(translations[currentLang].errors.totalLimit);
      continue;
    }
    if (uploads.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
    uploads.push(file);
    added += 1;
  }
  renderUploads();
  statusText.textContent = rejected[0] || (added ? (currentLang === 'en' ? `${added} file(s) attached.` : `${added}개 파일을 첨부했습니다.`) : '');
  fileInput.value = '';
}

fileInput.addEventListener('change', () => addFiles(fileInput.files));
uploadDrop.addEventListener('dragover', (event) => {
  event.preventDefault();
  uploadDrop.classList.add('is-dragging');
});
uploadDrop.addEventListener('dragleave', () => uploadDrop.classList.remove('is-dragging'));
uploadDrop.addEventListener('drop', (event) => {
  event.preventDefault();
  uploadDrop.classList.remove('is-dragging');
  addFiles(event.dataTransfer.files);
});

function cardForReview(review) {
  const card = document.createElement('article');
  card.className = 'review-card';
  const meta = document.createElement('div');
  meta.className = 'review-meta';
  const stars = document.createElement('b');
  stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const date = document.createElement('time');
  date.textContent = new Intl.DateTimeFormat(currentLang === 'en' ? 'en-US' : 'ko-KR', { dateStyle: 'medium' }).format(new Date(review.createdAt));
  meta.append(stars, date);
  const author = document.createElement('small');
  author.className = 'review-author';
  author.textContent = `${review.name || translations[currentLang].anonymous} · ${review.kind === '필드 레슨' ? translations[currentLang].field : review.kind === '원포인트 레슨' ? translations[currentLang].onepoint : translations[currentLang].studio}`;
  const text = document.createElement('p');
  text.className = 'review-text';
  text.textContent = review.message;
  card.append(meta, author, text);
  (review.files || []).forEach((file) => {
    const kind = file.type?.startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name);
    if (!kind && /\.(heic|heif)$/i.test(file.name)) {
      const badge = document.createElement('span');
      badge.className = 'review-media-fallback';
      badge.textContent = currentLang === 'en' ? 'HEIC photo' : 'HEIC 사진';
      card.append(badge);
      return;
    }
    const media = kind ? document.createElement('video') : document.createElement('img');
    media.src = URL.createObjectURL(file.blob);
    if (kind) { media.controls = true; media.preload = 'metadata'; }
    else media.alt = file.name || '후기 사진';
    card.append(media);
  });
  return card;
}
async function loadReviews(){let reviews=await dbRequest('readonly',store=>store.getAll());reviews=await removeDuplicateReviews(reviews);reviews.sort((a,b)=>b.createdAt-a.createdAt);document.querySelector('#total').textContent=String(reviews.length);document.querySelector('#reviews .score small').innerHTML=`<strong id="total">${reviews.length}</strong> ${currentLang==='en'?'reviews':'개의 후기'}`;const list=document.querySelector('#review-list');if(!reviews.length){list.innerHTML=`<p class="empty">${translations[currentLang].empty}</p>`;return}const avg=reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length;document.querySelector('#average').textContent=avg.toFixed(1);document.querySelector('#stars').textContent='★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg));list.replaceChildren(...reviews.map(cardForReview))}
document.querySelector('#review-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.querySelector('#message').value.trim();
  if (!rating) { statusText.textContent = translations[currentLang].errors.rating; return; }
  if (!message) { statusText.textContent = translations[currentLang].errors.message; return; }
  const submit = event.currentTarget.querySelector('button[type=submit]');
  submit.disabled = true;
  statusText.textContent = translations[currentLang].errors.saving;
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await dbRequest('readwrite', (store) => store.add({
      id, createdAt: Date.now(), rating,
      name: document.querySelector('#nickname').value.trim(),
      kind: document.querySelector('#lesson-kind').value,
      message,
      files: uploads.map((file) => ({ name: file.name, type: file.type, blob: file.slice(0, file.size, file.type) })),
    }));
    for (const file of uploads) {
      const url = previewUrls.get(file);
      if (url) URL.revokeObjectURL(url);
    }
    event.currentTarget.reset();
    uploads = [];
    renderUploads();
    rating = 0;
    rates.forEach((star) => star.classList.remove('active'));
    document.querySelector('#rate-label').textContent = translations[currentLang].rating[0] || (currentLang === 'en' ? 'Select a rating' : '별점을 선택해주세요');
    await loadReviews();
    statusText.textContent = translations[currentLang].errors.saved;
  } catch (error) {
    if (error?.name === 'QuotaExceededError') statusText.textContent = currentLang === 'en' ? 'This device is low on storage. Remove some attachments and try again.' : '이 기기의 저장 공간이 부족합니다. 첨부 파일을 줄인 뒤 다시 등록해주세요.';
    else if (error?.name === 'DataCloneError') statusText.textContent = currentLang === 'en' ? 'This file type could not be saved. Please attach a JPG, PNG, or MP4 file.' : '이 파일 형식은 저장되지 않습니다. JPG, PNG, MP4 파일로 다시 첨부해주세요.';
    else statusText.textContent = currentLang === 'en' ? 'Your browser blocked local storage. Reopen the page and try again.' : '브라우저가 저장을 차단했습니다. 페이지를 새로 연 뒤 다시 시도해주세요.';
  } finally {
    submit.disabled = false;
  }
});
loadReviews().catch(()=>{document.querySelector('#status').textContent='이 브라우저에서는 후기 저장을 사용할 수 없습니다.'});

// Korean / English interface. External Naver map and store pages remain unchanged.
const translations = {
  ko: {
    title: '고바다 프로 | Private Golf Lesson',
    description: 'KPGA PRO 고바다 프로의 1:1 프라이빗 골프 레슨과 필드 레슨. 정직하고 효율적인 레슨을 만나보세요.',
    text: {
      '.contact-link': ['레슨 문의 ↗'],
      '.hero-copy>p:not(.eyebrow)': ['골프의 감각을 깨우는 가장 정직한 레슨. 고바다 프로와 당신만의 스윙을 완성하세요.'],
      '.hero-copy .button': ['레슨 알아보기 ↘'],
      '#about div>p:not(.eyebrow)': ['골프를 오래 헤매지 않도록. 현재의 움직임을 정확히 보고 필요한 변화를 명확하게 전합니다.', '약속드립니다. 레슨을 질질 끌지 않겠습니다. 최대한 빠르게 잘 치실 수 있도록 정직하게 레슨합니다.'],
      '#about .career li': ['KPGA PRO · KPGA 챌린지 투어 · 스릭슨 투어 활동', '서울고등학교 졸업 · 한양대학교 스포츠과학 학사', '연세대학교 대학원 스포츠교육학 석사과정', '체육 정교사 자격증 · 한국대학연맹 다수 입상', '(전) 남서울CC · 더스윙블랙 분당정자점', '(현) 더프라자 골프 스튜디오 레슨'],
      '#lessons .cards h3': ['트랙맨 스튜디오 레슨', '필드 레슨'],
      '#lessons .cards p': ['데이터와 코치의 관찰을 바탕으로 스윙의 원인을 찾고 실제 변화를 만들어갑니다.', '연습장에서 만든 스윙을 코스 전략과 상황별 선택으로 연결합니다.'],
      '#schedule .schedule-title h2': ['레슨 스케줄'],
      '#schedule .schedule-row>b': ['MON · 월', 'TUE · 화', 'WED–THU · 수·목', 'FRI · 금', 'SAT · 토', 'SUN · 일'],
      '#schedule .schedule-row span': ['강남 · 더프라자 학동 1호점', '신촌 · 더프라자 이대점', '필드 레슨', '강남 · 더프라자 학동 1호점', '강남 · 더프라자 서초교대점', '분당 · 더프라자 판교점'],
      '#schedule .schedule-row a': ['위치 안내 ↗', '위치 안내 ↗', '예약 문의 ↗', '위치 안내 ↗', '위치 안내 ↗', '위치 안내 ↗'],
      '#schedule>small': ['레슨 시간 및 지점은 예약 문의 후 확정됩니다.'],
      '.prices h2': ['레슨 비용'],
      '.price-count': ['원포인트', '5회 레슨', '10회 레슨', '20회 레슨', '필드 레슨'],
      '.price-value small': ['회당 170,000원', '회당 160,000원', '회당 150,000원', '팀당', '(프로 그린피, 카트비, 캐디피 별도 부담)'],
      '.prices ul li': ['스튜디오 이용료 포함', '레슨권 유효기간 1년', '24시간 전까지 예약 변경 가능 · 당일 취소 불가', '원포인트 예약금 환불 불가'],
      '#reviews .review-head>div>p:last-child': ['레슨을 경험한 분들의 솔직한 이야기가 다음 골퍼에게 좋은 선택의 기준이 됩니다.'],
      '#reviews .review-list-title h3': ['레슨 후기'],
      '#reviews .review-list-title>small': ['최신순'],
      '#review-form h3': ['레슨은 어떠셨나요?'],
      '#review-form .upload-heading strong': ['사진 · 영상 첨부'],
      '#review-form .upload-heading small': ['생생한 레슨 경험을 함께 나눠주세요.'],
      '#review-form .upload-drop>strong': ['파일을 선택하거나 여기로 끌어오세요'],
      '#review-form .upload-drop>small': ['사진 · 영상 · 파일당 최대 30MB · 전체 80MB'],
      '#review-form .local-note': ['후기는 현재 작성한 기기의 브라우저에 저장됩니다. 모든 방문자와 공유하려면 공개 서버 연결이 필요합니다.'],
      '#review-form .review-submit span': ['후기 등록'],
      '.shop>div+div>p:not(.eyebrow)': ['B\'Ada.GOLF 골프장갑 편안한 그립과 깔끔한 실루엣을 만나보세요.'],
      '.shop h3 small': ['1개'],
      '.colors button': ['○ 화이트', '● 블랙'],
      '#shop .shop-controls button': ['← 이전 사진', '다음 사진 →'],
      '#buy': ['구매하기 ↗'],
      '.contact .eyebrow': ['START YOUR NEXT ROUND'],
      '.contact .button': ['레슨 문의하기　↗']
    },
    html: {
      '.hero-copy h1': '더 빠르게,<br><em>더 정확하게.</em>',
      '#about h2': '안녕하세요,<br><em>고바다 프로</em>입니다.',
      '#lessons h2': '당신에게 맞춘<br><em>프라이빗 코칭.</em>',
      '.prices h2': '레슨 <em>비용</em>',
      '#reviews .review-head h2': '레슨의 변화,<br><em>직접 들려주세요.</em>',
      '#shop h2': '필드 위 작은 디테일,<br><em>프로의 선택.</em>',
      '.contact h2': '다음 스윙은<br><em>더 좋아질 수 있습니다.</em>'
    },
    labels: {'.inputs label':['닉네임 <small>선택</small>', '레슨 종류'], '#review-form .message-label':['후기 내용'], '#review-form legend':['만족도 <small>필수</small>']},
    placeholders: {'#nickname':'닉네임을 입력해주세요', '#message':'레슨에서 느낀 변화와 기억에 남는 점을 들려주세요.'},
    rating:['','아쉬워요','보통이에요','괜찮아요','만족스러워요','정말 만족해요'],
    color:'컬러　', white:'화이트', black:'블랙', anonymous:'익명의 골퍼', studio:'스튜디오 레슨', field:'필드 레슨', onepoint:'원포인트 레슨', photo:'사진', video:'영상', empty:'아직 등록된 후기가 없습니다.<br>첫 번째 레슨 후기를 기다립니다.', errors:{rating:'별점을 선택해주세요.', message:'후기 내용을 입력해주세요.', saving:'후기를 저장하고 있습니다.', saved:'후기가 이 기기에 저장되었습니다.', maxFiles:'첨부 파일은 최대 5개까지 가능합니다.', photoVideo:'사진 또는 영상 파일만 첨부할 수 있습니다.', eachLimit:'파일당 30MB 이하로 첨부해주세요.', totalLimit:'첨부 파일 전체 용량은 80MB까지 가능합니다.'}
  },
  en: {
    title: 'Kobada Pro | Private Golf Lessons',
    description: 'Private golf and on-course lessons with KPGA Professional Kobada Pro. Honest, focused coaching to help you improve efficiently.',
    text: {
      '.contact-link': ['LESSON INQUIRY ↗'],
      '.hero-copy>p:not(.eyebrow)': ['Honest coaching that reconnects you with the feel of the game. Build a swing that is truly yours with Kobada Pro.'],
      '.hero-copy .button': ['EXPLORE LESSONS ↘'],
      '#about div>p:not(.eyebrow)': ['Stop searching for answers in your swing. I will assess your movement clearly and show you the changes that matter.', 'My promise: lessons will stay focused and efficient. I coach honestly to help you play better as soon as possible.'],
      '#about .career li': ['KPGA Professional · KPGA Challenge Tour · Srixon Tour', 'Seoul High School · B.A. in Sports Science, Hanyang University', 'M.A. coursework in Sports Pedagogy, Yonsei University Graduate School', 'Certified Physical Education Teacher · Multiple Korean University Golf Federation awards', 'Former: Namseoul Country Club · The Swing Black Bundang Jeongja', 'Currently teaching at The Plaza Golf Studio'],
      '#lessons .cards h3': ['TrackMan Studio Lesson', 'On-Course Lesson'],
      '#lessons .cards p': ['Identify the cause of your swing with TrackMan data and coaching observation, then turn insights into lasting changes.', 'Take your practice swing onto the course with strategy and confident decisions in every situation.'],
      '#schedule .schedule-title h2': ['Weekly Lesson Schedule'],
      '#schedule .schedule-row>b': ['MON', 'TUE', 'WED–THU', 'FRI', 'SAT', 'SUN'],
      '#schedule .schedule-row span': ['Gangnam · The Plaza Hakdong 1st', 'Sinchon · The Plaza Ewha', 'On-course lessons', 'Gangnam · The Plaza Hakdong 1st', 'Gangnam · The Plaza Seocho-Gyodae', 'Bundang · The Plaza Pangyo'],
      '#schedule .schedule-row a': ['DIRECTIONS ↗', 'DIRECTIONS ↗', 'BOOK BY PHONE ↗', 'DIRECTIONS ↗', 'DIRECTIONS ↗', 'DIRECTIONS ↗'],
      '#schedule>small': ['Lesson times and locations are confirmed when you inquire.'],
      '.prices h2': ['Lesson Fees'],
      '.price-count': ['Single Lesson', '5 Lessons', '10 Lessons', '20 Lessons', 'On-Course Lesson'],
      '.price-value small': ['per lesson ₩170,000', 'per lesson ₩160,000', 'per lesson ₩150,000', 'per team', '(Pro green fee, cart, and caddie fees not included)'],
      '.prices ul li': ['Studio fee included', 'Lesson package valid for 1 year', 'Reschedule up to 24 hours before; same-day cancellations are not accepted', 'Single-lesson deposits are non-refundable'],
      '#reviews .review-head>div>p:last-child': ['Honest feedback from our students helps the next golfer choose the right lesson.'],
      '#reviews .review-list-title h3': ['Student Reviews'],
      '#reviews .review-list-title>small': ['LATEST'],
      '#review-form h3': ['How was your lesson?'],
      '#review-form .upload-heading strong': ['Add photos or videos'],
      '#review-form .upload-heading small': ['Share a glimpse of your lesson experience.'],
      '#review-form .upload-drop>strong': ['Choose files or drag them here'],
      '#review-form .upload-drop>small': ['Photos · Videos · Up to 30 MB per file · 80 MB total'],
      '#review-form .local-note': ['Reviews are saved in this browser on this device. A public server is needed to share reviews with everyone.'],
      '#review-form .review-submit span': ['POST REVIEW'],
      '.shop>div+div>p:not(.eyebrow)': ['B\'Ada.GOLF Golf Glove. A comfortable grip and a clean, refined look for your game.'],
      '.shop h3 small': ['1 piece'],
      '.colors button': ['○ WHITE', '● BLACK'],
      '#shop .shop-controls button': ['← PREVIOUS', 'NEXT →'],
      '#buy': ['BUY NOW ↗'],
      '.contact .eyebrow': ['START YOUR NEXT ROUND'],
      '.contact .button': ['BOOK A LESSON　↗']
    },
    html: {
      '.hero-copy h1': 'Play better,<br><em>with purpose.</em>',
      '#about h2': 'Hello,<br><em>I’m Kobada Pro.</em>',
      '#lessons h2': 'Coaching tailored<br><em>to your game.</em>',
      '.prices h2': 'Lesson <em>Fees</em>',
      '#reviews .review-head h2': 'Your progress,<br><em>in your words.</em>',
      '#shop h2': 'Small details on the course,<br><em>a pro’s choice.</em>',
      '.contact h2': 'Your next swing<br><em>can be even better.</em>'
    },
    labels: {'.inputs label':['Name <small>Optional</small>', 'Lesson type'], '#review-form .message-label':['Your review'], '#review-form legend':['Rating <small>Required</small>']},
    placeholders: {'#nickname':'Enter your name', '#message':'Tell us what changed and what stood out in your lesson.'},
    rating:['','Needs improvement','Fair','Good','Very satisfied','Excellent'],
    color:'Color　', white:'White', black:'Black', anonymous:'Anonymous golfer', studio:'Studio lesson', field:'On-course lesson', onepoint:'Single lesson', photo:'Photo', video:'Video', empty:'No reviews yet.<br>Be the first to share your lesson experience.', errors:{rating:'Please select a star rating.', message:'Please enter your review.', saving:'Saving your review…', saved:'Your review has been saved on this device.', maxFiles:'You can attach up to 5 files.', photoVideo:'Please attach photo or video files only.', eachLimit:'Each file must be 30 MB or smaller.', totalLimit:'The total attachment size must be 80 MB or less.'}
  }
};
let currentLang = localStorage.getItem('kobada-language') === 'en' ? 'en' : 'ko';
function translateMany(selector, values) { document.querySelectorAll(selector).forEach((el, i) => { if (values[i] !== undefined) el.textContent = values[i]; }); }
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('kobada-language', lang);
  const d = translations[lang];
  document.documentElement.lang = lang;
  document.title = d.title;
  document.querySelector('meta[name="description"]').content = d.description;
  Object.entries(d.text).forEach(([selector, values]) => translateMany(selector, values));
  Object.entries(d.html).forEach(([selector, value]) => { const el = document.querySelector(selector); if (el) el.innerHTML = value; });
  Object.entries(d.labels).forEach(([selector, values]) => document.querySelectorAll(selector).forEach((el, i) => { if (selector === '.inputs label') { const input = el.querySelector('input,select'); el.replaceChildren(document.createTextNode('')); el.insertAdjacentHTML('afterbegin', values[i]); if(input) el.append(input); } else { const child = el.querySelector('small'); el.firstChild.textContent = values[i].split('<small>')[0]; if(child) child.textContent = values[i].match(/<small>(.*?)<\/small>/)?.[1] || ''; } }));
  Object.entries(d.placeholders).forEach(([selector, value]) => { const el = document.querySelector(selector); if (el) el.placeholder = value; });
  document.querySelectorAll('[data-language]').forEach(button => { const active = button.dataset.language === lang; button.setAttribute('aria-pressed', String(active)); button.classList.toggle('active', active); });
  const empty = document.querySelector('#review-list .empty'); if (empty) empty.innerHTML = d.empty;
  const rateLabel = document.querySelector('#rate-label'); if (rateLabel) rateLabel.textContent = rating ? d.rating[rating] : (lang === 'en' ? 'Select a rating' : '별점을 선택해주세요');
  document.querySelector('#color-name').textContent = `${d.color}${gloveColor === 'white' ? d.white : d.black}`;
  document.querySelectorAll('.price > b').forEach((el, i) => { const amounts = ['200,000']; if(i === 0) el.textContent = lang === 'en' ? `₩${amounts[0]}` : `${amounts[0]}원`; });
  document.querySelectorAll('.price-value b').forEach((el, i) => { const amount = ['850,000','1,600,000','3,000,000','1,000,000'][i]; const textNode = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE); if(textNode) textNode.textContent = lang === 'en' ? ` ₩${amount}` : ` ${amount}원`; });
  const scoreSmall = document.querySelector('#reviews .score small'); if(scoreSmall) scoreSmall.innerHTML = `<strong id="total">${document.querySelector('#total').textContent}</strong> ${lang === 'en' ? 'reviews' : '개의 후기'}`;
  document.querySelectorAll('#lesson-kind option').forEach((option, i) => { option.textContent = lang === 'en' ? [d.studio,d.field,d.onepoint][i] : ['스튜디오 레슨','필드 레슨','원포인트 레슨'][i]; });
  document.querySelectorAll('[data-rate]').forEach((button, i) => button.setAttribute('aria-label', lang === 'en' ? `${i+1} star${i ? 's' : ''}` : `${i+1}점`));
  gloveImage.alt = `${d[gloveColor]} golf glove, photo ${gloveIndex + 1}`;
  document.querySelector('.hero>img').alt = lang === 'en' ? 'Kobada Pro during a golf swing' : '고바다 프로의 골프 스윙';
  document.querySelector('#about img').alt = lang === 'en' ? 'KPGA Professional Kobada Pro' : 'KPGA PRO 고바다 프로';
  document.querySelector('#prev').setAttribute('aria-label', lang === 'en' ? 'Previous photo' : '이전 사진');
  document.querySelector('#next').setAttribute('aria-label', lang === 'en' ? 'Next photo' : '다음 사진');
  renderUploads();
  loadReviews().catch(() => {});
}
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
applyLanguage(currentLang);
