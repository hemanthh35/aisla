import React from 'react';
import './NotificationsModal.css';

const NotificationsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const notifications = [
        {
            id: 1,
            title: 'Viva Voice Added',
            message: 'New AI-powered oral assessment module is now available in Labs & Tools.',
            time: 'Just now',
            type: 'feature',
            isNew: true
        },
        {
            id: 2,
            title: 'Chemistry Lab Updated',
            message: 'Fixed issues with chemical reactions in the virtual lab environment.',
            time: '2 hours ago',
            type: 'update',
            isNew: true
        },
        {
            id: 3,
            title: 'Quiz System Maintenance',
            message: 'Scheduled maintenance for the quiz generation engine tonight at 11 PM.',
            time: '5 hours ago',
            type: 'system',
            isNew: false
        },
        {
            id: 4,
            title: 'New badges available',
            message: 'Check out the new "Science Wizard" and "Lab Master" badges in your profile.',
            time: '1 day ago',
            type: 'reward',
            isNew: false
        }
    ];

    return (
        <div className="notifications-overlay" onClick={onClose}>
            <div className="notifications-modal" onClick={e => e.stopPropagation()}>
                <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="notifications-list">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${notif.isNew ? 'unread' : ''}`}>
                            <div className={`notification-icon ${notif.type}`}>
                                {notif.type === 'feature' && '🚀'}
                                {notif.type === 'update' && '⚡'}
                                {notif.type === 'system' && '🛠️'}
                                {notif.type === 'reward' && '🏆'}
                            </div>
                            <div className="notification-content">
                                <div className="notification-title">
                                    {notif.title}
                                    {notif.isNew && <span className="new-badge">New</span>}
                                </div>
                                <p className="notification-message">{notif.message}</p>
                                <span className="notification-time">{notif.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="notifications-footer">
                    <button className="mark-read-btn">Mark all as read</button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
