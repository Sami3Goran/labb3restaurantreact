import { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';

const BookingMaker = ({ refreash }) => {


    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [guestAttending, setGuestAttending] = useState(0);
    const [tableId, setTableId] = useState(0);
    const [bookingStart, setBookingStart] = useState('');
    const [step, setStep] = useState(1);
    const [date, setDate] = useState('');
    const [availableTables, setAvailableTables] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [error, setError] = useState('');
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const handleNextStep = () => {
        if (step === 1 && !date) {
            alert("You need to pick a date.");
            return;
        }
        if (step === 2 && (!guestAttending || guestAttending < 1 || guestAttending > 8)) {
            alert("there can only come 1-8 guests at a time");
            return;
        }
        if (step === 3 && !tableId) {
            alert("You need to pick a table");
            return;
        }
        if (step === 4 && !bookingStart) {
            alert("You need to pick a time for the booking to start");
            return;
        }

        if (step === 5 && (!firstName || !lastName || !phoneNumber || !email)) {
            alert("You need to fill in everything to progress");
            return;
        }
        
        if (step === 6 && (!date || !guestAttending || !tableId || !bookingStart|| !firstName || !lastName || !phoneNumber || !email)) {
            alert("Check if everythings correct");
            return;
        }
        setStep(step + 1);
    };

    // letar efter bord som passar antalet gäster som kommer.
    const handlesearchTables = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`https://localhost:7003/api/Table/GetAvailableTables/${guestAttending}`);
            setAvailableTables(response.data);
            console.log(response)
        } catch (error) {
            console.error("Error fetching available tables", error);
            setError('Error fetching available tables! Please try again.');
        }
    };

    // användaren väljer bord vars id sparas i tableid
    const handleTableSelect = async (tableId) => {
        setTableId(tableId); 

        // efter den satt rätt table id, hämtas tillgängliga tider.
        await handleFetchAvailableTimes(tableId);
    };

    // hämtar tillgängliga tider för det valda bordet
    const handleFetchAvailableTimes = async (tableId) => {
        if (!date || !tableId) {
            return;
        }

        try {
            const response = await axios.get(`https://localhost:7003/api/Booking/GetBookingByTableIdAndDate/${tableId}/${date}`);
            setAvailableTimes(response.data);
            console.log(response);
        } catch (error) {
            console.error("can not fetch times, api problem", error);
            setError('can not fetch the available times please try again later');
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        const booking = {
            tableId,
            firstName,
            lastName,
            CustomersPhoneNo:phoneNumber,
            email,
            guestAttending,
            bookingDate:date,  // : new Date(date).toISOString().split('T')[0],
            bookingStart: `${bookingStart}:00` // bookingstart konverteras här till rätt format
        };

        console.log("booking object to be sent:", booking);

        try {
            await axios.post('https://localhost:7003/api/Booking/AddBooking', booking)
            alert('booking created successfully');
            setBookingConfirmed(true);

        } catch (error) {
            if (error.response) {
                console.error("Server responded with:", error.response.data);
                console.error("Status code:", error.response.status);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error during request setup:", error.message);
            }
            setError('Error creating booking');
        }
    }

    // skapar tider man kan välja mellan
    const createTimeSlots = () => {
        const times = [];
        for (let hour = 10; hour <= 21; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 21 && minute > 0) break;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                times.push(time);
            }
        }
        return times;
    };

    // gör så att det är 2 timmar mellan varje bokning och hämtar redan bookade tider.
    const getBookedTimes = () => {
        const slots = createTimeSlots();
        const bookedTimes = availableTimes.map((booking) => 
            booking.bookingStart.split(':')[0] + ':' + booking.bookingStart.split(':')[1]
        );

        return slots.map((time, index) => {
            const isBooked = bookedTimes.includes(time) || 
                [1, 2, 3].some(offset => slots[index + offset] && bookedTimes.includes(slots[index + offset])) ||
                [-1, -2, -3].some(offset => slots[index + offset] && bookedTimes.includes(slots[index + offset]));
            
            return {
                time,
                isBooked,
            };
        });
    };

    return (
        <div className="container mt-5">
            <h2 className="fixed-top bg-light p-3">Create a Booking</h2> 
    
            <div className="step-content mt-5 pt-5">
                {step === 1 && (
                    <>
                        <h4>- Pick a Date -</h4>
                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <button 
                            onClick={handleNextStep} 
                            className="btn btn-outline-primary mt-3"
                        >
                            Next
                        </button>
                    </>
                )}
                    
                {step === 2 && (
                    <>
                        <h4>- Pick Guest Attending -</h4>
                        <ul className="list-group">
                            {[...Array(8)].map((_, index) => {
                                const guestAttendingNumber = index + 1;
                                return (
                                    <li 
                                        key={index} 
                                        className={`list-group-item d-flex justify-content-between align-items-center ${guestAttending === guestAttendingNumber ? 'bg-light text-dark' : ''}`} 
                                        onClick={() => setGuestAttending(guestAttendingNumber)} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {guestAttendingNumber} Guests
                                        {guestAttending === guestAttendingNumber && <span className="badge bg-primary">Selected</span>}
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="d-flex justify-content-between mt-4">
                            <button 
                                onClick={() => {
                                    setStep(step - 1); 
                                    setGuestAttending(0);
                                }} 
                                className="btn btn-outline-secondary"
                            >
                                Back
                            </button>
                            <button 
                                onClick={(e) => { handlesearchTables(e); handleNextStep(); }} 
                                className="btn btn-outline-primary"
                                disabled={guestAttending < 1}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}


                    
                {step === 3 && (
                    <>
                        <h4>- Available Tables -</h4>
                        {availableTables.length > 0 ? (
                            <ul className="list-group">
                                {availableTables.map((table) => (
                                    <li 
                                        key={table.id} 
                                        className={`list-group-item d-flex justify-content-between align-items-center ${tableId === table.id ? 'bg-light text-dark' : ''}`} 
                                        onClick={() => handleTableSelect(table.id)} 
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Table {table.tableNumber}
                                        {tableId === table.id && <span className="badge bg-primary">Selected</span>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No available tables for {guestAttending} guests.</p>
                        )}

                        <div className="d-flex justify-content-between mt-4">
                            <button
                                onClick={() => {
                                    setStep(step - 1); 
                                    setTableId(0);
                                }}
                                className="btn btn-outline-secondary"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleNextStep} 
                                className="btn btn-outline-primary"
                                disabled={!tableId}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}



                    
                {step === 4 && (
                    <>
                        <h4>- Select Your Start Time -</h4>
                        <p>Your booking will be valid for up to two hours following the selected start time.</p>

                        {getBookedTimes().every(({ isBooked }) => isBooked) ? (
                            <div className="alert alert-warning" role="alert">
                                Sorry, there are no available times. Please go back and try selecting a different table.
                            </div>
                        ) : (
                            <ul className="list-group">
                                {getBookedTimes()
                                    .filter(({ isBooked }) => !isBooked)
                                    .map(({ time }) => (
                                        <li 
                                            key={time} 
                                            className={`list-group-item d-flex justify-content-between align-items-center ${bookingStart === time ? 'bg-light text-dark' : ''}`} 
                                            onClick={() => setBookingStart(time)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {time}
                                            {bookingStart === time && <span className="badge bg-primary">Selected</span>}
                                        </li>
                                    ))}
                            </ul>
                        )}

                            <div className="d-flex justify-content-between mt-4">
                                <button 
                                    onClick={() => {
                                        setStep(step - 1); 
                                        setBookingStart('');
                                    }}
                                    className="btn btn-outline-secondary d-flex align-items-center"
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back
                                </button>
                                
                                <button 
                                    onClick={handleNextStep} 
                                    className="btn btn-outline-primary d-flex align-items-center"
                                    disabled={!bookingStart || getBookedTimes().every(({ isBooked }) => isBooked)}
                                >
                                    Next <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                    </>
                )}



                    
                {step === 5 && (
                    <>
                        <h4>- Write in the neccesary form -</h4>
                        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="row g-3 mt-4">
                            <div className="col-md-6">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    className="form-control"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    className="form-control"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                                <input
                                    id="phoneNumber"
                                    type="tel"
                                    className="form-control"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-12 d-flex justify-content-between mt-4">
                                <button 
                                    onClick={() => {
                                        setStep(step - 1); 
                                        setFirstName('');
                                        setLastName('');
                                        setPhoneNumber('');
                                        setEmail('');
                                    }}
                                    className="btn btn-outline-secondary"
                                >
                                    <i className="fas fa-arrow-left me-2"></i> Back
                                </button>
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-outline-primary"
                                >
                                    Next <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            </div>
                        </form>
                    </>
                )}


                    
                {step === 6 && (
                    <>
                        <h4>Booking Preview</h4>
                        <p><strong>Date:</strong> {date}</p>
                        <p><strong>Guests:</strong> {guestAttending}</p>
                        <p><strong>Table:</strong> {availableTables.find((table) => table.id === tableId)?.tableNumber} - Seats: {availableTables.find((table) => table.id === tableId)?.tableSeats}</p>
                        <p><strong>Reservation:</strong> {bookingStart}</p>
                        <p><strong>First Name:</strong> {firstName}</p>
                        <p><strong>Last Name:</strong> {lastName}</p>
                        <p><strong>Phone Number:</strong> {phoneNumber}</p>
                        <p><strong>Email:</strong> {email}</p>

                        <div className="d-flex justify-content-between mt-4">
                            <button 
                                onClick={() => setStep(step - 1)}
                                className="btn btn-outline-secondary"
                            >
                                <i className="fas fa-arrow-left me-2"></i> Back
                            </button>

                            <button 
                                onClick={(e) => { 
                                    handleSubmit(e);
                                    handleNextStep()
                                }} 
                                className="btn btn-outline-success"
                            >
                                Confirm <i className="fas fa-check ms-2"></i>
                            </button>
                        </div>
                    </>
                )}


                    
                {step === 7 && bookingConfirmed && (
                    <>
                        <h4>Booking Confirmed!</h4>
                        <p>Your Booking has been successfully completed.</p>
                        <div className="d-flex justify-content-between mt-3">
                            <button 
                                onClick={() => {
                                    window.location.href = "https://localhost:7015/";
                                }} 
                                className="btn btn-outline-primary"
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => {
                                    refreash();
                                }} 
                                className="btn btn-outline-primary ms-2"
                            >
                                New Booking
                            </button>
                        </div>
                    </>
                )}

                {error && <div className="alert alert-danger mt-4">{error}</div>}
            </div>
        </div>
    );
    
    
};

export default BookingMaker;
