document.addEventListener('DOMContentLoaded', function() {
    // BUG FIX: Key harus 'reminders', sama seperti yang di-set di logstarlight.js
    const REMINDER_STORAGE_KEY = 'reminders'; 
    const TABLE_BODY = document.getElementById('dataReminderTableBody');
    const SEARCH_INPUT = document.getElementById('searchReminder');
    const FILTER_STATUS = document.getElementById('filterReminderStatus');
    const EXPORT_BUTTON = document.getElementById('exportReminders');

    let reminders = [];

    // --- Fungsi Helper ---
    const getRemindersData = () => JSON.parse(localStorage.getItem(REMINDER_STORAGE_KEY) || '[]');
    const saveRemindersData = (data) => localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(data));

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- Render Tabel ---
    const renderReminders = () => {
        TABLE_BODY.innerHTML = '';
        const sortedReminders = [...reminders].sort((a, b) => new Date(a.date) - new Date(b.date));
        const filteredReminders = filterAndSearchReminders(sortedReminders);

        if (filteredReminders.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted">Tidak ada pengingat ditemukan.</td></tr>`;
            return;
        }

        filteredReminders.forEach(reminder => {
            const row = document.createElement('tr');
            const isDone = reminder.isDone;
            row.classList.toggle('table-success', isDone);
            row.classList.toggle('table-warning', !isDone && new Date(reminder.date) < new Date(new Date().setHours(0, 0, 0, 0)));
            
            // --- PERUBAHAN 1: Buat link Google Calendar sebagai "Acara Sepanjang Hari" ---
            const eventTitle = encodeURIComponent(`TUGAS: ${reminder.title}`);
            const eventDetails = encodeURIComponent(`Catatan: ${reminder.notes || 'Tidak ada catatan.'}`);
            const reminderDateStr = reminder.date.replace(/-/g, '');
            // Untuk acara sepanjang hari, tanggal akhir adalah hari berikutnya
            const nextDay = new Date(reminder.date + 'T00:00:00');
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
            const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${reminderDateStr}/${nextDayStr}&details=${eventDetails}&sf=true&output=xml`;

            row.innerHTML = `
                <td class="text-center">${formatDateForDisplay(reminder.date)}</td>
                <td>${reminder.title}</td>
                <td>${reminder.notes || '-'}</td>
                <td class="text-center"><span class="badge ${isDone ? 'bg-success' : 'bg-primary'}">${isDone ? 'Selesai' : 'Aktif'}</span></td>
                <td class="action-buttons text-center">
                    <div class="btn-group">
                        <button class="btn btn-sm ${isDone ? 'btn-secondary' : 'btn-success'} toggle-status-btn" data-id="${reminder.id}" title="${isDone ? 'Aktifkan Kembali' : 'Tandai Selesai'}">
                            <i class="bi ${isDone ? 'bi-arrow-counterclockwise' : 'bi-check-circle-fill'}"></i>
                        </button>
                        <a href="${googleCalendarLink}" target="_blank" class="btn btn-sm btn-info" title="Tambah ke Google Calendar">
                            <i class="bi bi-google"></i>
                        </a>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${reminder.id}" title="Hapus">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });
        addEventListenersToButtons();
    };

    const filterAndSearchReminders = (remindersToFilter) => {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedStatus = FILTER_STATUS.value;

        return remindersToFilter.filter(reminder => {
            const matchesSearch = (reminder.title.toLowerCase().includes(searchTerm) || (reminder.notes && reminder.notes.toLowerCase().includes(searchTerm)));
            let matchesStatus = true;
            if (selectedStatus === 'Aktif') matchesStatus = !reminder.isDone;
            else if (selectedStatus === 'Selesai') matchesStatus = reminder.isDone;
            return matchesSearch && matchesStatus;
        });
    };

    const toggleStatus = (id) => {
        reminders = reminders.map(r => (r.id === id ? { ...r, isDone: !r.isDone } : r));
        saveRemindersData(reminders);
        renderReminders();
    };

    const deleteReminder = (id) => {
        if (confirm('Yakin ingin menghapus pengingat ini?')) {
            reminders = reminders.filter(r => r.id !== id);
            saveRemindersData(reminders);
            renderReminders();
        }
    };

    // --- PERUBAHAN 2: Export ke .ics sebagai format TUGAS (VTODO) ---
    const exportToIcs = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FinanceManager//NONSGML v1.0//EN\n";

        reminders.filter(r => !r.isDone).forEach(reminder => {
            const dateStr = reminder.date.replace(/-/g, '');
            const dtstamp = new Date().toISOString().replace(/[-:.]/g, '') + 'Z';
            const summary = `TUGAS: ${reminder.title}`;
            const description = `Catatan: ${reminder.notes || 'Tidak ada catatan.'}`;

            icsContent += "BEGIN:VTODO\n"; // Menggunakan VTODO untuk tugas
            icsContent += `UID:${reminder.id}@financemanager\n`;
            icsContent += `DTSTAMP:${dtstamp}\n`;
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`; // Tanggal mulai tugas
            icsContent += `DUE;VALUE=DATE:${dateStr}\n`;     // Tanggal jatuh tempo tugas
            icsContent += `SUMMARY:${summary}\n`;
            icsContent += `DESCRIPTION:${description}\n`;
            icsContent += `STATUS:NEEDS-ACTION\n`; // Status tugas
            icsContent += "END:VTODO\n";
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengingat_tugas_starlight_${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.toggle-status-btn').forEach(button => button.onclick = (e) => toggleStatus(e.currentTarget.dataset.id));
        document.querySelectorAll('.delete-btn').forEach(button => button.onclick = (e) => deleteReminder(e.currentTarget.dataset.id));
    };

    // --- Inisialisasi ---
    const initializePage = () => {
        reminders = getRemindersData();
        renderReminders();
        SEARCH_INPUT.addEventListener('keyup', renderReminders);
        FILTER_STATUS.addEventListener('change', renderReminders);
        EXPORT_BUTTON.addEventListener('click', exportToIcs);
    };

    initializePage();
});
