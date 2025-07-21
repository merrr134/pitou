document.addEventListener('DOMContentLoaded', function() {
    const REMINDER_STORAGE_KEY = 'starlightReminders';
    const TABLE_BODY = document.getElementById('dataReminderTableBody');
    const SEARCH_INPUT = document.getElementById('searchReminder');
    const FILTER_STATUS = document.getElementById('filterReminderStatus');
    const EXPORT_BUTTON = document.getElementById('exportReminders');

    let starlightReminders = [];

    // --- Utility Functions ---
    function getRemindersFromLocalStorage() {
        const storedReminders = localStorage.getItem(REMINDER_STORAGE_KEY);
        return storedReminders ? JSON.parse(storedReminders) : [];
    }

    function saveRemindersToLocalStorage(remindersArray) {
        localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(remindersArray));
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

    // --- Render Reminders to Table ---
    function renderReminders() {
        TABLE_BODY.innerHTML = ''; // Clear existing rows

        // Sort reminders by date (earliest first)
        const sortedReminders = [...starlightReminders].sort((a, b) => {
            return new Date(a.reminderDate) - new Date(b.reminderDate);
        });

        const filteredReminders = filterAndSearchReminders(sortedReminders);

        if (filteredReminders.length === 0) {
            TABLE_BODY.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada pengingat ditemukan.</td></tr>`;
            return;
        }

        filteredReminders.forEach(reminder => {
            const row = document.createElement('tr');
            const isCompleted = reminder.isCompleted;
            row.classList.toggle('table-success', isCompleted); // Green for completed
            // Highlight overdue reminders in yellow
            row.classList.toggle('table-warning', !isCompleted && new Date(reminder.reminderDate) < new Date(new Date().setHours(0,0,0,0)));

            // Google Calendar URL construction (UPDATED for 8 PM)
            const eventTitle = encodeURIComponent(`Gift Starlight: ${reminder.nickCust} (${reminder.tipeSL})`);
            const eventDetails = encodeURIComponent(`Waktunya Gift Starlight untuk akun ${reminder.nickCust} (${reminder.tipeSL}).\nCatatan: ${reminder.notes || 'Tidak ada catatan.'}`);

            const reminderDateStr = reminder.reminderDate.replace(/-/g, ''); // YYYYMMDD
            const startTime = '200000'; // 8 PM (20:00:00)
            const endTime = '210000';   // 9 PM (21:00:00) - for a 1-hour event

            const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${reminderDateStr}T${startTime}/${reminderDateStr}T${endTime}&details=${eventDetails}&sf=true&output=xml`;


            row.innerHTML = `
                <td>${formatDateForDisplay(reminder.reminderDate)}</td>
                <td>${reminder.nickCust}</td>
                <td>${reminder.tipeSL}</td>
                <td>${reminder.notes || '-'}</td>
                <td>${isCompleted ? 'Selesai' : 'Aktif'}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1 toggle-status-btn" data-id="${reminder.id}">${isCompleted ? 'Aktifkan Kembali' : 'Tandai Selesai'}</button>
                    <a href="${googleCalendarLink}" target="_blank" class="btn btn-sm btn-primary me-1">Ke Kalender</a>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${reminder.id}">Hapus</button>
                </td>
            `;
            TABLE_BODY.appendChild(row);
        });

        addEventListenersToButtons();
    }

    // --- Search and Filter Logic ---
    function filterAndSearchReminders(remindersToFilter) {
        const searchTerm = SEARCH_INPUT.value.toLowerCase();
        const selectedStatus = FILTER_STATUS.value;

        return remindersToFilter.filter(reminder => {
            const matchesSearch = reminder.nickCust.toLowerCase().includes(searchTerm) ||
                                  reminder.tipeSL.toLowerCase().includes(searchTerm) ||
                                  (reminder.notes && reminder.notes.toLowerCase().includes(searchTerm));

            let matchesStatus = true;
            if (selectedStatus === 'Aktif') {
                matchesStatus = !reminder.isCompleted;
            } else if (selectedStatus === 'Selesai') {
                matchesStatus = reminder.isCompleted;
            }

            return matchesSearch && matchesStatus;
        });
    }

    // --- Toggle Reminder Status ---
    function toggleReminderStatus(id) {
        starlightReminders = starlightReminders.map(r => {
            if (r.id === id) {
                return { ...r, isCompleted: !r.isCompleted };
            }
            return r;
        });
        saveRemindersToLocalStorage(starlightReminders);
        renderReminders();
    }

    // --- Delete Reminder ---
    function deleteReminder(id) {
        if (confirm('Apakah Anda yakin ingin menghapus pengingat ini?')) {
            starlightReminders = starlightReminders.filter(reminder => reminder.id !== id);
            saveRemindersToLocalStorage(starlightReminders);
            renderReminders();
        }
    }

    // --- Export to iCalendar (.ics) ---
    function exportToIcs() {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//FinanceManager//NONSGML v1.0//EN\n";

        starlightReminders.filter(r => !r.isCompleted).forEach(reminder => {
            const reminderDate = new Date(reminder.reminderDate + 'T20:00:00'); // Set to 8 PM for ICS export
            const dtstart = reminderDate.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'; // YYYYMMDDTHHMMSSZ
            const dtend = new Date(reminderDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'; // 1 hour later
            const dtstamp = new Date().toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';

            const summary = `Reminder Gift MLBB - ${reminder.nickCust} (${reminder.tipeSL})`;
            const description = `Waktunya Gift Starlight untuk akun ${reminder.nickCust} (${reminder.tipeSL}). Catatan: ${reminder.notes || 'Tidak ada catatan.'}`;

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `UID:${reminder.id}@financemanager\n`;
            icsContent += `DTSTAMP:${dtstamp}\n`;
            icsContent += `DTSTART:${dtstart}\n`;
            icsContent += `DTEND:${dtend}\n`;
            icsContent += `SUMMARY:${summary}\n`;
            icsContent += `DESCRIPTION:${description}\n`;
            icsContent += "END:VEVENT\n";
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengingat_starlight_${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Event Listeners for Reminder Table Buttons ---
    function addEventListenersToButtons() {
        document.querySelectorAll('.toggle-status-btn').forEach(button => {
            button.onclick = (e) => {
                toggleReminderStatus(e.target.dataset.id);
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                deleteReminder(e.target.dataset.id);
            };
        });
    }

    // Initialize data and render on page load
    starlightReminders = getRemindersFromLocalStorage();
    renderReminders();

    // Event listeners for search and filter
    SEARCH_INPUT.addEventListener('keyup', renderReminders);
    FILTER_STATUS.addEventListener('change', renderReminders);
    EXPORT_BUTTON.addEventListener('click', exportToIcs);
});
