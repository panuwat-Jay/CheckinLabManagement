/* admin-monitor-adapter.js
 * Adapter layer to convert JavaScript to use Django API instead of LocalStorage DB
 * This file provides a DB-like interface that calls Django API endpoints.
 */

const DB = {
    // GET all computers
    getPCs: async function() {
        try {
            const response = await fetch('/api/admin/computers-list/');
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            console.error('Error fetching computers:', e);
            return [];
        }
    },

    // GET all bookings for a specific date
    getBookings: async function(dateStr) {
        try {
            const url = dateStr ? `/api/admin/bookings-list/?date=${dateStr}` : '/api/admin/bookings-list/';
            const response = await fetch(url);
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            console.error('Error fetching bookings:', e);
            return [];
        }
    },

    // GET all logs for a specific date
    getLogs: async function(dateStr) {
        try {
            const url = dateStr ? `/api/admin/logs-list/?date=${dateStr}` : '/api/admin/logs-list/';
            const response = await fetch(url);
            const data = await response.json();
            return data.data || [];
        } catch (e) {
            console.error('Error fetching logs:', e);
            return [];
        }
    },

    // UPDATE computer status
    updatePCStatus: async function(pcId, status, currentUser, options) {
        try {
            const response = await fetch('/api/admin/update-pc-status/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pc_id: pcId,
                    status: status,
                    current_user: currentUser
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Error updating PC status:', e);
            return { success: false };
        }
    },

    // CREATE a new log entry
    saveLog: async function(logData) {
        try {
            const response = await fetch('/api/admin/create-log/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });
            return await response.json();
        } catch (e) {
            console.error('Error saving log:', e);
            return { success: false };
        }
    },

    // UPDATE booking status
    updateBookingStatus: async function(bookingId, status) {
        try {
            const response = await fetch('/api/admin/update-booking-status/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingId,
                    status: status
                })
            });
            return await response.json();
        } catch (e) {
            console.error('Error updating booking status:', e);
            return { success: false };
        }
    }
};
