document.addEventListener('DOMContentLoaded', function() {
    const LOG_STORAGE_KEY = 'starlightLogs';
    const REMINDER_STORAGE_KEY = 'starlightReminders';

    const TABLE_BODY = document.getElementById('dataLogTableBody');
    const LOG_FORM = document.getElementById('logForm');
    const ADD_EDIT_MODAL = new bootstrap.Modal(document.getElementById('tambahLogModal'));
    const MODAL_TITLE = document.getElementById('tambahLogModalLabel');

    // Log Form inputs
    const INPUT_ID = document.getElementById('editLogId');
    const INPUT_TGL_ADD = document.getElementById('inputTglAdd');
    const INPUT_NICK_AKUN_GIFT = document.getElementById('inputNickAkunGift');
    const INPUT_ID_CUST = document.getElementById('inputIdCust');
    const INPUT_NICK_CUST = document.getElementById('inputNickCust');
    const INPUT_TIPE_SL = document.getElementById('inputTipeSL');
    const INPUT_SUDAH_BAYAR = document.getElementById('inputSudahBayar');
    const INPUT_STATUS_GIFT = document.getElementById('inputStatusGift');
    const INPUT_TGL_GIFT = document.getElementById('inputTglGift'); // Tanggal Gift yang akan jadi basis pengingat
    const INPUT_CATATAN = document.getElementById('inputCatatan');

    // Search and filter elements
    const SEARCH_INPUT = document.getElementById('searchLog');
    const FILTER_STATUS_GIFT = document.getElementById('filterStatusGift');
    const FILTER_TIPE_SL = document.getElementById('filterTipeSL');

    // Reminder Modal elements
    const ADD_REMINDER_MODAL = new bootstrap.Modal(document.getElementById('addReminderModal'));
    const REMINDER_FORM = document.getElementById('reminderForm');
    const REMINDER_LOG_ID = document.getElementById('reminderLogId');
    const REMINDER_NICK_CUST = document.getElementById('reminderNickCust');
    const REMINDER_TIPE_SL = document.getElementById('reminderTipeSL');
    const REMINDER_DATE = document.getElementById('reminderDate');
    const REMINDER_NOTES = document.getElementById('reminderNotes');


    let starlightLogs = [];

    // --- Utility Functions for Starlight Logs ---
    function getLogsFromLocalStorage() {
        const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
        return storedLogs ? JSON.parse(storedLogs) : [];
    }

    function saveLogsToLocalStorage(logsArray) {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsArray));
    }

    // --- Utility Functions for Reminders ---
    function getRemindersFromLocalStorage() {
        const storedReminders = localStorage.getItem(REMINDER_STORAGE_KEY);
        return storedReminders ? JSON.parse(storedReminders) : [];
    }

    function saveRemindersToLocalStorage(remindersArray) {
        localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(remindersArray));
    }

    // --- Formatting Functions ---
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    }

    function formatDateForDisplay(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // --- Render Logs to Table ---
    function renderLogs() {
        TABLE_BODY.innerHTML = ''; // Clear existing rows
        const filteredLogs = filterAndSearchLogs(starlightLogs);

        if (filteredLogs.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="10" class="text-center">Tidak ada catatan log ditemukan.</td></tr>`;
            return;
        }

        filteredLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDateForDisplay(log.tglAdd)}</td>
                <td>${log.nickAkunGift}</td>
                <td>${log.idCust}</td>
                <td>${log.nickCust}</td>
                <td>${log.tipeSL}</td>
                <td><span class="badge bg-${log.sudahBayar ? 'success' : 'danger'}">${log.sudahBayar ? 'Sudah' : 'Belum'}</span></td>
                <td><span class="badge bg-${log.statusGift === 'Done' ? 'success' : log.statusGift === 'Pending' ? 'warning' : 'danger'}">${log.statusGift}</span></td>
                <td>${formatDateForDisplay(log.tglGift)}</td>
                <td>${log.catatan || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1 add-reminder-btn"
                        data-logid="${log.id}"
                        data-nickcust="${log.nickCust}"
                        data-tipesl="${log.tipeSL}"
                        data-tglgift="${log.tglGift}"
                        >Tambah Pengingat</button>
                    <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${log.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${log.id}">Hapus</button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToLogButtons();
    }

    // --- Search and Filter Logic ---
    function filterAndSearchLogs(logsToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedStatusGift = FILTER_STATUS_GIFT.value.toLowerCase();
        const selectedTipeSL = FILTER_TIPE_SL.value.toLowerCase();

        return logsToFilter.filter(log => {
            const matchesSearch = log.idCust.toLowerCase().includes(searchTerm) ||
                                  log.nickCust.toLowerCase().includes(searchTerm) ||
                                  (log.catatan && log.catatan.toLowerCase().includes(searchTerm));

            const matchesStatusGift = selectedStatusGift === '' || log.statusGift.toLowerCase() === selectedStatusGift;
            const matchesTipeSL = selectedTipeSL === '' || log.tipeSL.toLowerCase() === selectedTipeSL;

            return matchesSearch && matchesStatusGift && matchesTipeSL;
        });
    }

    // --- Add/Edit Log Functions ---
    function resetLogForm() {
        LOG_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.textContent = 'Tambah Log Starlight Baru';
        const today = new Date().toISOString().split('T')[0];
        INPUT_TGL_ADD.value = today;
        INPUT_TGL_GIFT.value = today;
    }

    function addLog(newLog) {
        starlightLogs.push(newLog);
        saveLogsToLocalStorage(starlightLogs);
        renderLogs();
    }

    function updateLog(updatedLog) {
        starlightLogs = starlightLogs.map(l => l.id === updatedLog.id ? updatedLog : l);
        saveLogsToLocalStorage(starlightLogs);
        renderLogs();
    }

    function deleteLog(id) {
        if (confirm('Apakah Anda yakin ingin menghapus catatan log ini?')) {
            starlightLogs = starlightLogs.filter(log => log.id !== id);
            // Delete associated reminders when log is deleted
            let reminders = getRemindersFromLocalStorage();
            reminders = reminders.filter(r => r.starlightLogId !== id);
            saveRemindersToLocalStorage(reminders);
            saveLogsToLocalStorage(starlightLogs);
            renderLogs();
        }
    }

    // --- Event Listeners for Log Form ---
    LOG_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const id = INPUT_ID.value || Date.now().toString();
        const tglAdd = INPUT_TGL_ADD.value;
        const nickAkunGift = INPUT_NICK_AKUN_GIFT.value.trim();
        const idCust = INPUT_ID_CUST.value.trim();
        const nickCust = INPUT_NICK_CUST.value.trim();
        const tipeSL = INPUT_TIPE_SL.value;
        const sudahBayar = INPUT_SUDAH_BAYAR.checked;
        const statusGift = INPUT_STATUS_GIFT.value;
        const tglGift = INPUT_TGL_GIFT.value;
        const catatan = INPUT_CATATAN.value.trim();

        if (!tglAdd || !nickAkunGift || !idCust || !nickCust || !tipeSL || !statusGift || !tglGift) {
            alert('Mohon lengkapi semua data yang diperlukan (kecuali Catatan).');
            return;
        }

        const newLog = {
            id: id,
            tglAdd: tglAdd,
            nickAkunGift: nickAkunGift,
            idCust: idCust,
            nickCust: nickCust,
            tipeSL: tipeSL,
            sudahBayar: sudahBayar,
            statusGift: statusGift,
            tglGift: tglGift,
            catatan: catatan
        };

        if (INPUT_ID.value) {
            updateLog(newLog);
        } else {
            addLog(newLog);
        }

        ADD_EDIT_MODAL.hide();
        resetLogForm();
    });

    // --- Event Listeners for Log Table Buttons ---
    function addEventListenersToLogButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const idToEdit = e.target.dataset.id;
                const logToEdit = starlightLogs.find(log => log.id === idToEdit);

                if (logToEdit) {
                    MODAL_TITLE.textContent = 'Edit Log Starlight';
                    INPUT_ID.value = logToEdit.id;
                    INPUT_TGL_ADD.value = logToEdit.tglAdd;
                    INPUT_NICK_AKUN_GIFT.value = logToEdit.nickAkunGift;
                    INPUT_ID_CUST.value = logToEdit.idCust;
                    INPUT_NICK_CUST.value = logToEdit.nickCust;
                    INPUT_TIPE_SL.value = logToEdit.tipeSL;
                    INPUT_SUDAH_BAYAR.checked = logToEdit.sudahBayar;
                    INPUT_STATUS_GIFT.value = logToEdit.statusGift;
                    INPUT_TGL_GIFT.value = logToEdit.tglGift;
                    INPUT_CATATAN.value = logToEdit.catatan;

                    ADD_EDIT_MODAL.show();
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                deleteLog(e.target.dataset.id);
            };
        });

        // --- Add Reminder Button ---
        document.querySelectorAll('.add-reminder-btn').forEach(button => {
            button.onclick = (e) => {
                const logId = e.target.dataset.logid;
                const nickCust = e.target.dataset.nickcust;
                const tipeSL = e.target.dataset.tipesl;
                const tglGift = e.target.dataset.tglgift; // Menggunakan tglGift sebagai basis

                // Pre-fill reminder modal
                REMINDER_LOG_ID.value = logId;
                REMINDER_NICK_CUST.value = nickCust;
                REMINDER_TIPE_SL.value = tipeSL;

                // Sarankan tanggal pengingat (misal: 30 hari dari TGL GIFT)
                const suggestedDate = new Date(tglGift);
                suggestedDate.setDate(suggestedDate.getDate() + 30);
                REMINDER_DATE.value = suggestedDate.toISOString().split('T')[0];

                REMINDER_NOTES.value = `Pengingat gift ${tipeSL} untuk ${nickCust} (dari log tanggal gift: ${formatDateForDisplay(tglGift)}).`;

                ADD_REMINDER_MODAL.show();
            };
        });
    }

    // --- Event Listener for Reminder Form ---
    REMINDER_FORM.addEventListener('submit', function(event) {
        event.preventDefault();

        const reminderId = Date.now().toString();
        const linkedLogId = REMINDER_LOG_ID.value;
        const nickCust = REMINDER_NICK_CUST.value.trim();
        const tipeSL = REMINDER_TIPE_SL.value.trim();
        const reminderDate = REMINDER_DATE.value;
        const notes = REMINDER_NOTES.value.trim();

        if (!reminderDate || !nickCust || !tipeSL) {
            alert('Mohon lengkapi Tanggal Pengingat, Nickname Customer, dan Tipe Starlight.');
            return;
        }

        const newReminder = {
            id: reminderId,
            starlightLogId: linkedLogId,
            reminderDate: reminderDate,
            nickCust: nickCust,
            tipeSL: tipeSL,
            notes: notes,
            isCompleted: false
        };

        let reminders = getRemindersFromLocalStorage();
        reminders.push(newReminder);
        saveRemindersToLocalStorage(reminders);

        alert('Pengingat berhasil ditambahkan! Silakan cek di halaman "Pengingat".');
        ADD_REMINDER_MODAL.hide();
        REMINDER_FORM.reset();
    });


    // Initialize data and render on page load
    starlightLogs = getLogsFromLocalStorage();
    renderLogs();

    // Set default dates for new log on initial load
    const today = new Date().toISOString().split('T')[0];
    INPUT_TGL_ADD.value = today;
    INPUT_TGL_GIFT.value = today;

    // Event listeners for search and filter
    SEARCH_INPUT.addEventListener('keyup', renderLogs);
    FILTER_STATUS_GIFT.addEventListener('change', renderLogs);
    FILTER_TIPE_SL.addEventListener('change', renderLogs);

    // Reset log form when its modal is hidden
    document.getElementById('tambahLogModal').addEventListener('hidden.bs.modal', resetLogForm);
});
