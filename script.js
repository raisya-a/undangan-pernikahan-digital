const TARGET_DATE = new Date('2026-12-20T08:00:00+07:00');
const STORAGE_KEY = 'undangan_rina_dimas_ucapan';
const MAX_WISHES = 100;

const body = document.body;
const cover = document.getElementById('cover');
const btnOpen = document.getElementById('btnOpen');
const btnMusic = document.getElementById('btnMusic');
const music = document.getElementById('bgMusic');

const params = new URLSearchParams(window.location.search);
const guestFromUrl = (params.get('to') || '').trim().slice(0, 50);

if (guestFromUrl) {
	document.getElementById('guestName').textContent = guestFromUrl;
	document.getElementById('coverGuest').hidden = false;
	document.getElementById('kehadiranName').value = guestFromUrl;
}

btnOpen.addEventListener('click', () => {
	cover.classList.add('hide');
	body.classList.remove('locked');
	btnMusic.classList.remove('d-none');
	playMusic();
	window.scrollTo(0, 0);
});

const toast = document.createElement('div');
toast.className = 'music-toast';
document.body.appendChild(toast);

function showToast(msg) {
	toast.textContent = msg;
	toast.classList.add('show');
	setTimeout(() => {
		toast.classList.remove('show');
	}, 2500);
}

function playMusic() {
	const p = music.play();
	if (p) {
		p.catch(() => {
		});
	}
}

music.addEventListener('play', () => {
	btnMusic.classList.add('playing');
	btnMusic.classList.remove('error');
});

music.addEventListener('pause', () => {
	btnMusic.classList.remove('playing');
});

music.addEventListener('error', () => {
	btnMusic.classList.add('error');
	showToast('File lagu.mp3 tidak ditemukan');
});

btnMusic.addEventListener('click', () => {
	if (music.paused) {
		music.play().catch(() => {
			showToast('Lagu tidak dapat diputar (cek lagu.mp3)');
		});
	} else {
		music.pause();
	}
});

const cd = {
	days: document.getElementById('cdDays'),
	hours: document.getElementById('cdHours'),
	mins: document.getElementById('cdMins'),
	secs: document.getElementById('cdSecs')
};

function pad(n) {
	return String(n).padStart(2, '0');
}

function updateCountdown() {
	const diff = TARGET_DATE - new Date();

	if (diff <= 0) {
		Object.values(cd).forEach(el => {
			el.textContent = '00';
		});
		return;
	}

	cd.days.textContent = pad(Math.floor(diff / 86400000));
	cd.hours.textContent = pad(Math.floor(diff / 3600000) % 24);
	cd.mins.textContent = pad(Math.floor(diff / 60000) % 60);
	cd.secs.textContent = pad(Math.floor(diff / 1000) % 60);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const kehadiranForm = document.getElementById('kehadiranForm');
const kehadiranName = document.getElementById('kehadiranName');
const kehadiranMessage = document.getElementById('kehadiranMessage');
const kehadiranNote = document.getElementById('kehadiranNote');
const wishList = document.getElementById('wishList');
const statHadir = document.getElementById('statHadir');
const statTidak = document.getElementById('statTidak');

function loadWishes() {
	try {
		const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
		return Array.isArray(data) ? data : [];
	} catch (err) {
		return [];
	}
}

function saveWishes(list) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
		return true;
	} catch (err) {
		return false;
	}
}

function formatDate(timestamp) {
	return new Date(timestamp).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

function createWishElement(item) {
	const isHadir = item.status === 'hadir';
	const wrap = document.createElement('div');
	wrap.className = 'wish';
	const head = document.createElement('div');
	head.className = 'wish-head';
	const name = document.createElement('span');
	name.className = 'wish-name';
	name.textContent = item.name;
	const badge = document.createElement('span');
	badge.className = 'badge-status ' + (isHadir ? 'hadir' : 'tidak');
	badge.textContent = isHadir ? 'Hadir' : 'Tidak Hadir';
	const time = document.createElement('span');
	time.className = 'wish-time';
	time.textContent = formatDate(item.time);
	head.append(name, badge, time);
	wrap.appendChild(head);
	if (item.message) {
		const text = document.createElement('p');
		text.className = 'wish-text';
		text.textContent = item.message;
		wrap.appendChild(text);
	}
	return wrap;
}

function renderWishes() {
	const list = loadWishes();
	let hadir = 0;
	let tidak = 0;

	wishList.textContent = '';

	if (list.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'wish-empty';
		empty.textContent = 'Belum ada ucapan. Jadilah yang pertama!';
		wishList.appendChild(empty);
	}

	list.forEach(item => {
		if (item.status === 'hadir') {
			hadir++;
		} else {
			tidak++;
		}
		wishList.appendChild(createWishElement(item));
	});

	statHadir.textContent = hadir;
	statTidak.textContent = tidak;
}

function showNote(msg, isError) {
	kehadiranNote.textContent = msg;
	kehadiranNote.classList.toggle('error', Boolean(isError));
	setTimeout(() => {
		kehadiranNote.textContent = '';
	}, 4000);
}

kehadiranForm.addEventListener('submit', event => {
	event.preventDefault();

	const name = kehadiranName.value.trim();
	const checked = kehadiranForm.querySelector('input[name="status"]:checked');
	const message = kehadiranMessage.value.trim();

	if (!name || !checked) {
		showNote('Mohon isi nama dan pilih status kehadiran.', true);
		return;
	}

	const list = loadWishes();
	list.unshift({
		name: name.slice(0, 50),
		status: checked.value === 'hadir' ? 'hadir' : 'tidak',
		message: message.slice(0, 300),
		time: Date.now()
	});

	if (!saveWishes(list.slice(0, MAX_WISHES))) {
		showNote('Data tidak dapat disimpan di browser ini.', true);
		return;
	}

	const attending = checked.value === 'hadir';
	kehadiranForm.reset();
	if (guestFromUrl) {
		kehadiranName.value = guestFromUrl;
	}
	renderWishes();
	showNote(
		attending
			? 'Terima kasih, kehadiran dan doa Anda sudah terkirim.'
			: 'Terima kasih atas ucapan dan doa Anda.',
		false
	);
});

renderWishes();

const observer = new IntersectionObserver((entries, obs) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('show');
			obs.unobserve(entry.target);
		}
	});
}, {
	threshold: 0.15
});

document.querySelectorAll('.reveal').forEach(el => {
	observer.observe(el);
});