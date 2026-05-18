let selectedFile = null;

/* ── File Icons by extension ────────────────────────────────── */
const FILE_ICONS = {
  pdf: '📕', doc: '📘', docx: '📘',
  ppt: '📙', pptx: '📙', zip: '🗜',
  txt: '📄', png: '🖼', jpg: '🖼', jpeg: '🖼',
};

function getIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
}

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ── File Selection ─────────────────────────────────────────── */
function handleFileSelect(input) {
  const file = input.files?.[0];
  if (!file) return;

  const maxBytes = 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    showError('File exceeds the 20 MB limit.'); input.value = ''; return;
  }

  selectedFile = file;
  hideError();

  document.getElementById('fileIcon').textContent  = getIcon(file.name);
  document.getElementById('fileName').textContent  = file.name;
  document.getElementById('fileSize').textContent  = formatBytes(file.size);
  document.getElementById('filePreview').classList.add('show');
  document.getElementById('dropZone').style.opacity = '0.5';
}

function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').classList.remove('show');
  document.getElementById('dropZone').style.opacity = '1';
}

/* ── Drag & Drop ────────────────────────────────────────────── */
const dropZone = document.getElementById('dropZone');
if (dropZone) {
  ['dragenter', 'dragover'].forEach(evt =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'))
  );
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const input = document.getElementById('fileInput');
      // Simulate file input change
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect(input);
    }
  });
}

/* ── Upload ─────────────────────────────────────────────────── */
async function handleUpload() {
  hideError();

  const title       = document.getElementById('title')?.value.trim();
  const description = document.getElementById('description')?.value.trim();

  if (!title)        { showError('Project title is required.'); return; }
  if (!selectedFile) { showError('Please select a file to upload.'); return; }

  setLoading('uploadBtn', true);
  showProgress(0, 'Preparing upload...');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('project_file', selectedFile);

  try {
    // Simulate progress (XHR for real progress tracking)
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 90);
        showProgress(pct, `Uploading... ${pct}%`);
      }
    });

    const result = await new Promise((resolve, reject) => {
      xhr.onload  = () => resolve({ status: xhr.status, body: xhr.responseText });
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', '/projects/upload');
      xhr.send(formData);
    });

    showProgress(100, 'Upload complete!');

    const data = JSON.parse(result.body);

    if (result.status === 201) {
      showSuccessMsg('Project submitted! Pending faculty review.');
      resetForm();
    } else {
      showError(data.error || data.errors?.[0]?.msg || 'Upload failed.');
    }
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    setLoading('uploadBtn', false);
    setTimeout(() => hideProgress(), 2000);
  }
}

function resetForm() {
  removeFile();
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
}

/* ── Progress ───────────────────────────────────────────────── */
function showProgress(pct, label) {
  document.getElementById('progressWrap').classList.add('show');
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = label;
}

function hideProgress() {
  document.getElementById('progressWrap').classList.remove('show');
  document.getElementById('progressFill').style.width = '0%';
}

/* ── Alerts ─────────────────────────────────────────────────── */
function showError(msg) {
  const el  = document.getElementById('errorAlert');
  const msg2 = document.getElementById('errorMsg');
  if (el && msg2) { msg2.textContent = msg; el.classList.add('show'); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideError() {
  document.getElementById('errorAlert')?.classList.remove('show');
}

function showSuccessMsg(msg) {
  const el  = document.getElementById('successAlert');
  const msg2 = document.getElementById('successMsg');
  if (el && msg2) { msg2.textContent = msg; el.classList.add('show'); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

/* ── Logout ─────────────────────────────────────────────────── */
async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/auth/login';
}
