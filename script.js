const gloveSets={white:['white-1.jpg','white-2.jpg','white-3.jpg','white-4.jpg','white-5.jpg'],black:['black-1.jpg','black-2.jpg','black-3.jpg','black-4.jpg','black-5.jpg']};
let gloveColor='white',gloveIndex=0;
const gloveImage=document.querySelector('#glove-image');
function showGlove(){const list=gloveSets[gloveColor];gloveIndex=(gloveIndex+list.length)%list.length;gloveImage.src=`assets/gloves/${list[gloveIndex]}`;gloveImage.alt=`${gloveColor==='white'?'화이트':'블랙'} 골프 장갑 사진 ${gloveIndex+1}`;document.querySelector('#counter').textContent=`${String(gloveIndex+1).padStart(2,'0')} / 05`}
function moveGlove(n){gloveIndex+=n;showGlove()}
document.querySelector('#prev').onclick=()=>moveGlove(-1);document.querySelector('#next').onclick=()=>moveGlove(1);document.querySelector('#shop-prev').onclick=()=>moveGlove(-1);document.querySelector('#shop-next').onclick=()=>moveGlove(1);
document.querySelectorAll('.colors button').forEach(button=>button.addEventListener('click',()=>{gloveColor=button.dataset.color;gloveIndex=0;document.querySelectorAll('.colors button').forEach(b=>b.classList.toggle('selected',b===button));document.querySelector('#color-name').textContent=`컬러　${gloveColor==='white'?'화이트':'블랙'}`;document.querySelector('#buy').href=gloveColor==='white'?'https://naver.me/xPYzBGC9':'https://naver.me/GfrQPgTP';showGlove()}));
const rates=[...document.querySelectorAll('[data-rate]')];let rating=0;const labels=['','아쉬워요','보통이에요','괜찮아요','만족스러워요','정말 만족해요'];
rates.forEach(button=>button.addEventListener('click',()=>{rating=Number(button.dataset.rate);rates.forEach(star=>star.classList.toggle('active',Number(star.dataset.rate)<=rating));document.querySelector('#rate-label').textContent=labels[rating]}));
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
      visual.textContent = 'PHOTO';
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
  metadata.textContent = `${kind === 'video' ? '영상' : '사진'} · ${formatBytes(file.size)}`;
  details.append(filename, metadata);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'upload-remove';
  remove.setAttribute('aria-label', `${file.name} 첨부 삭제`);
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
      rejected.push('첨부 파일은 최대 5개까지 가능합니다.');
      break;
    }
    if (!fileKind(file)) {
      rejected.push(`${file.name}: 사진 또는 영상 파일만 첨부할 수 있습니다.`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push(`${file.name}: 파일당 30MB 이하로 첨부해주세요.`);
      continue;
    }
    const total = uploads.reduce((sum, item) => sum + item.size, 0);
    if (total + file.size > MAX_TOTAL_SIZE) {
      rejected.push('첨부 파일 전체 용량은 80MB까지 가능합니다.');
      continue;
    }
    if (uploads.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
    uploads.push(file);
    added += 1;
  }
  renderUploads();
  statusText.textContent = rejected[0] || (added ? `${added}개 파일을 첨부했습니다.` : '');
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
  date.textContent = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(review.createdAt));
  meta.append(stars, date);
  const author = document.createElement('small');
  author.className = 'review-author';
  author.textContent = `${review.name || '익명의 골퍼'} · ${review.kind}`;
  const text = document.createElement('p');
  text.className = 'review-text';
  text.textContent = review.message;
  card.append(meta, author, text);
  (review.files || []).forEach((file) => {
    const kind = file.type?.startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name);
    if (!kind && /\.(heic|heif)$/i.test(file.name)) {
      const badge = document.createElement('span');
      badge.className = 'review-media-fallback';
      badge.textContent = 'HEIC 사진';
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
async function loadReviews(){let reviews=await dbRequest('readonly',store=>store.getAll());reviews=await removeDuplicateReviews(reviews);reviews.sort((a,b)=>b.createdAt-a.createdAt);document.querySelector('#total').textContent=String(reviews.length);const list=document.querySelector('#review-list');if(!reviews.length){list.innerHTML='<p class="empty">아직 등록된 후기가 없습니다.<br>첫 번째 레슨 후기를 기다립니다.</p>';return}const avg=reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length;document.querySelector('#average').textContent=avg.toFixed(1);document.querySelector('#stars').textContent='★'.repeat(Math.round(avg))+'☆'.repeat(5-Math.round(avg));list.replaceChildren(...reviews.map(cardForReview))}
document.querySelector('#review-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('#message').value.trim();
  if (!rating) { statusText.textContent = '별점을 선택해주세요.'; return; }
  if (!message) { statusText.textContent = '후기 내용을 입력해주세요.'; return; }
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  statusText.textContent = '후기를 저장하고 있습니다.';
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
    form.reset();
    uploads = [];
    renderUploads();
    rating = 0;
    rates.forEach((star) => star.classList.remove('active'));
    document.querySelector('#rate-label').textContent = '별점을 선택해주세요';
    await loadReviews();
    statusText.textContent = '후기가 이 기기에 저장되었습니다.';
  } catch (error) {
    if (error?.name === 'QuotaExceededError') statusText.textContent = '이 기기의 저장 공간이 부족합니다. 첨부 파일을 줄인 뒤 다시 등록해주세요.';
    else if (error?.name === 'DataCloneError') statusText.textContent = '이 파일 형식은 저장되지 않습니다. JPG, PNG, MP4 파일로 다시 첨부해주세요.';
    else statusText.textContent = '브라우저가 저장을 차단했습니다. 페이지를 새로 연 뒤 다시 시도해주세요.';
  } finally {
    submit.disabled = false;
  }
});
loadReviews().catch(()=>{document.querySelector('#status').textContent='이 브라우저에서는 후기 저장을 사용할 수 없습니다.'});
