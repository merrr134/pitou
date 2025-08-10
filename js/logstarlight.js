document.addEventListener('DOMContentLoaded', function () {
    const LOG_STORAGE_KEY = 'starlightLogs';
    const REMINDER_STORAGE_KEY = 'reminders';

    const TABLE_BODY = document.getElementById('dataLogTableBody');
    const LOG_FORM = document.getElementById('logForm');
    const ADD_LOG_MODAL = new bootstrap.Modal(document.getElementById('tambahLogModal'));
    const MODAL_TITLE = document.getElementById('tambahLogModalLabel');

    // Form Fields (Log)
    const INPUT_ID = document.getElementById('editLogId');
    const INPUT_TGL_ADD = document.getElementById('inputTglAdd');
    const INPUT_NICK_AKUN_GIFT = document.getElementById('inputNickAkunGift');
    const INPUT_ID_CUST = document.getElementById('inputIdCust');
    const INPUT_NICK_CUST = document.getElementById('inputNickCust');
    const INPUT_TIPE_SL = document.getElementById('inputTipeSL');
    const INPUT_STATUS_GIFT = document.getElementById('inputStatusGift');
    const INPUT_TGL_GIFT = document.getElementById('inputTglGift');
    const INPUT_SUDAH_BAYAR = document.getElementById('inputSudahBayar');
    const INPUT_CATATAN = document.getElementById('inputCatatan');

    // Filter Fields
    const SEARCH_INPUT = document.getElementById('searchLog');
    const FILTER_STATUS = document.getElementById('filterStatusGift');
    const FILTER_TIPE = document.getElementById('filterTipeSL');

    // Reminder Modal
    const ADD_REMINDER_MODAL = new bootstrap.Modal(document.getElementById('addReminderModal'));
    const REMINDER_FORM = document.getElementById('reminderForm');
    const REMINDER_LOG_ID = document.getElementById('reminderLogId');
    const REMINDER_NICK_CUST = document.getElementById('reminderNickCust');
    const REMINDER_TIPE_SL = document.getElementById('reminderTipeSL');
    const REMINDER_DATE = document.getElementById('reminderDate');
    const REMINDER_NOTES = document.getElementById('reminderNotes');

    let logs = [];

    // --- Data Helper Functions ---
    const getLogsData = () => JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
    const saveLogsData = (data) => localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(data));
    const getRemindersData = () => JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY) || '[]');
    const saveRemindersData = (data) => localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(data));

    const getStatusBadge = (status) => {
        const colors = { 'Pending': 'bg-warning text-dark', 'Done': 'bg-success', 'Cancel': 'bg-secondary', 'Error': 'bg-danger' };
        return `<span class="badge ${colors[status] || 'bg-dark'}">${status}</span>`;
    };
    
    const getCountdown = (tglGift) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date
        const giftDate = new Date(tglGift + 'T00:00:00');
        const diffTime = giftDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `<span class="countdown-urgent">Lewat ${Math.abs(diffDays)} hari</span>`;
        if (diffDays === 0) return `<span class="countdown-urgent">Hari Ini!</span>`;
        if (diffDays <= 7) return `<span class="countdown-soon">${diffDays} hari lagi</span>`;
        return `<span class="countdown-normal">${diffDays} hari lagi</span>`;
    };

    const renderLogs = () => {
        TABLE_BODY.innerHTML = '';
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const filterStatus = FILTER_STATUS.value;
        const filterTipe = FILTER_TIPE.value;

        const filteredLogs = logs
            .filter(log => (log.idCust.toLowerCase().includes(searchTerm) || log.nickCust.toLowerCase().includes(searchTerm)))
            .filter(log => filterStatus === '' || log.statusGift === filterStatus)
            .filter(log => filterTipe === '' || log.tipeSL === filterTipe);
        
        // Sort: Pending logs first, then by the closest gift date
        filteredLogs.sort((a, b) => {
            if (a.statusGift === 'Pending' && b.statusGift !== 'Pending') return -1;
            if (a.statusGift !== 'Pending' && b.statusGift === 'Pending') return 1;
            return new Date(a.tglGift) - new Date(b.tglGift);
        });

        if (filteredLogs.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">Tidak ada log yang cocok.</td></tr>`;
            return;
        }

        filteredLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-start">
                    <strong>${log.nickCust}</strong><br>
                    <small class="text-muted">${log.idCust}</small>
                </td>
                <td class="text-center">
                    ${log.nickAkunGift}<br>
                    <small class="text-muted">Added: ${new Date(log.tglAdd + 'T00:00:00').toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</small>
                </td>
                <td class="text-center">
                    <span class="badge ${log.tipeSL === 'Premium' ? 'bg-warning text-dark' : 'bg-primary'}">${log.tipeSL}</span><br>
                    <div class="form-check form-check-inline mt-1">
                        <input class="form-check-input" type="checkbox" disabled ${log.sudahBayar ? 'checked' : ''}>
                        <label class="form-check-label small">Paid</label>
                    </div>
                </td>
                <td class="text-center">${getStatusBadge(log.statusGift)}</td>
                <td class="text-center">
                    <strong>${getCountdown(log.tglGift)}</strong><br>
                    <small class="text-muted">${new Date(log.tglGift + 'T00:00:00').toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</small>
                </td>
                <td class="action-buttons text-center">
                    <button class="btn btn-sm btn-outline-info reminder-btn" data-id="${log.id}" title="Tambah Pengingat"><i class="bi bi-bell-fill"></i></button>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${log.id}" title="Edit"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${log.id}" title="Hapus"><i class="bi bi-trash3"></i></button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });
        addEventListenersToButtons();
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = e => handleEdit(e.currentTarget.dataset.id));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = e => handleDelete(e.currentTarget.dataset.id));
        document.querySelectorAll('.reminder-btn').forEach(btn => btn.onclick = e => handleReminder(e.currentTarget.dataset.id));
    };

    const resetForm = () => {
        LOG_FORM.reset();
        INPUT_ID.value = '';
        MODAL_TITLE.innerHTML = '<i class="bi bi-journal-plus me-2"></i>Formulir Log Starlight';
        INPUT_TGL_ADD.valueAsDate = new Date();
    };

    LOG_FORM.addEventListener('submit', (e) => {
        e.preventDefault();
        const logId = INPUT_ID.value;
        const logData = {
            id: logId || `SLOG-${Date.now()}`,
            tglAdd: INPUT_TGL_ADD.value, nickAkunGift: INPUT_NICK_AKUN_GIFT.value,
            idCust: INPUT_ID_CUST.value, nickCust: INPUT_NICK_CUST.value,
            tipeSL: INPUT_TIPE_SL.value, statusGift: INPUT_STATUS_GIFT.value,
            tglGift: INPUT_TGL_GIFT.value, sudahBayar: INPUT_SUDAH_BAYAR.checked,
            catatan: INPUT_CATATAN.value
        };

        if (logId) {
            logs = logs.map(log => log.id === logId ? logData : log);
        } else {
            logs.push(logData);
        }
        saveLogsData(logs);
        renderLogs();
        ADD_LOG_MODAL.hide();
    });

    const handleEdit = (id) => {
        const log = logs.find(l => l.id === id);
        if (!log) return;
        MODAL_TITLE.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Log Starlight';
        INPUT_ID.value = log.id;
        INPUT_TGL_ADD.value = log.tglAdd; INPUT_NICK_AKUN_GIFT.value = log.nickAkunGift;
        INPUT_ID_CUST.value = log.idCust; INPUT_NICK_CUST.value = log.nickCust;
        INPUT_TIPE_SL.value = log.tipeSL; INPUT_STATUS_GIFT.value = log.statusGift;
        INPUT_TGL_GIFT.value = log.tglGift; INPUT_SUDAH_BAYAR.checked = log.sudahBayar;
        INPUT_CATATAN.value = log.catatan;
        ADD_LOG_MODAL.show();
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus log ini?')) {
            logs = logs.filter(l => l.id !== id);
            saveLogsData(logs);
            renderLogs();
        }
    };
    
    // --- Reminder Logic ---
    const handleReminder = (id) => {
        const log = logs.find(l => l.id === id);
        if (!log) return;
        REMINDER_FORM.reset();
        REMINDER_LOG_ID.value = log.id;
        REMINDER_NICK_CUST.textContent = log.nickCust;
        REMINDER_TIPE_SL.textContent = log.tipeSL;
        REMINDER_DATE.value = log.tglGift; // Default ke tanggal gift
        REMINDER_NOTES.value = `Follow up Starlight untuk ${log.nickCust} (${log.idCust})`;
        ADD_REMINDER_MODAL.show();
    };
    
    REMINDER_FORM.addEventListener('submit', (e) => {
        e.preventDefault();
        const reminders = getRemindersData();
        const logId = REMINDER_LOG_ID.value;
        const log = logs.find(l => l.id === logId);

        const newReminder = {
            id: `REM-${Date.now()}`,
            logId: logId,
            title: `Gift SL: ${log.nickCust}`,
            date: REMINDER_DATE.value,
            notes: REMINDER_NOTES.value,
            isDone: false
        };
        reminders.push(newReminder);
        saveRemindersData(reminders);
        alert('Pengingat berhasil ditambahkan!');
        ADD_REMINDER_MODAL.hide();
    });


    // --- Initialization ---
    const initializePage = () => {
        logs = getLogsData();
        renderLogs();
        SEARCH_INPUT.addEventListener('keyup', renderLogs);
        FILTER_STATUS.addEventListener('change', renderLogs);
        FILTER_TIPE.addEventListener('change', renderLogs);
        document.getElementById('tambahLogModal').addEventListener('hidden.bs.modal', resetForm);
    };

    initializePage();
});
