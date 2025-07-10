import React, { useState } from 'react';
import axios from 'axios';
import './MainPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MainPage = () => {
  const [formData, setFormData] = useState({
    MailID: '',
    Password: '',
    FirstName: '',
    LastName: '',
    MobileNo: '',
    Gender: '',
    Dob: '',
    Pincode: '',
    Department: '',
    CurrentLocation: ''
  });

  const [errors, setErrors] = useState({});
  const [location, setLocation] = useState(null);
  const departments = ["IT", "CSE", "ECE", "MECH", "CIVIL", "EEE", "AI-ML", "AI-DS"];

  const [allData, setAllData] = useState([]);
  const [showTable, setShowTable] = useState(false);

  // All Data Display

const fetchAllData = async () => {
  try {
    const res = await axios.get('http://localhost:8000/api/v1/data/getdata');
    if (res.data.status === "Success") {
      setAllData(res.data.data);
      setShowTable(true);
      toast.success("Data fetched successfully!");
    } else {
      toast.warning("No data found.");
      setShowTable(false);
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch data.");
    setShowTable(false);
  }
};
  
  const validate = () => {
    const newErrors = {};
    if (!formData.MailID.includes('@')) newErrors.MailID = 'Valid email required';
    if (formData.Password.length < 8 || formData.Password.length > 15) newErrors.Password = 'Password must be 8-15 characters';
    if (formData.FirstName === '') newErrors.FirstName = 'First name is required';
    if (formData.LastName === '') newErrors.LastName = 'Last name is required';
    if (!/^\d{10}$/.test(formData.MobileNo)) newErrors.MobileNo = '10-digit mobile number required';
    if (!['Male', 'Female', 'Other'].includes(formData.Gender)) newErrors.Gender = 'Gender required';
    if (!/^\d{6}$/.test(formData.Pincode)) newErrors.Pincode = '6-digit pincode required';
    if (!departments.includes(formData.Department)) newErrors.Department = 'Select valid department';
    return newErrors;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const res = await axios.post('http://localhost:8000/api/v1/data/register', formData);
        toast.success("Registered successfully!");
        console.log(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Registration failed. Try again!");
      }
    } else {
      toast.warning("Please fix the form errors");
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        setFormData(prev => ({ ...prev, CurrentLocation: coords }));
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        toast.success("Location captured!");
      }, err => {
        toast.error("Failed to get location");
      });
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <>
    <div className="form-container">
      <h2>Data Collection</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value]) => (
          key !== 'Gender' && key !== 'Department' && key !== 'CurrentLocation' ? (
            <div className="form-group" key={key}>
              <label className={["MailID", "Password", "FirstName", "LastName", "MobileNo", "Gender", "Pincode", "Department"].includes(key) ? 'required' : ''}>
                {key}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <input
                  type={key === 'Password' ? 'password' : key === 'Dob' ? 'date' : 'text'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                />
                {errors[key] && <span className="error">{errors[key]}</span>}
              </div>
            </div>
          ) : null
        ))}

        <div className="form-group">
          <label className="required">Gender</label>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <select name="Gender" value={formData.Gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.Gender && <span className="error">{errors.Gender}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="required">Department</label>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <select name="Department" value={formData.Department} onChange={handleChange}>
              <option value="">Select Department</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            {errors.Department && <span className="error">{errors.Department}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Current Location</label>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="CurrentLocation"
                value={formData.CurrentLocation}
                onChange={handleChange}
                readOnly
                placeholder="Click 'Get My Location'"
              />
              <button type="button" onClick={getCurrentLocation}>Get My Location</button>
            </div>
          </div>
        </div>

        {location && (
          <div className="map-container" style={{ height: '300px', marginTop: '10px' }}>
            <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={location} />
            </MapContainer>
          </div>
        )}

        <button type="submit" style={{ backgroundColor: '#88b04b'}}>Submit</button>
      </form>

      <button type="button" onClick={fetchAllData} style={{ marginTop: '17px', backgroundColor: '#6a0dad'}}>Show All Entries</button>
      <ToastContainer position="top-center" autoClose={2000} closeButton={false} />
    </div>

    {showTable && (
      <div style={{ marginTop: '20px', overflowX: 'auto' }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
            <th>MailID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Mobile No</th>
            <th>Gender</th>
            <th>DOB</th>
            <th>Pincode</th>
            <th>Department</th>
            <th>Current Location</th>
            </tr>
          </thead>
          <tbody>
            {allData.map((item, index) => (
            <tr key={index}>
              <td>{item.MailID}</td>
              <td>{item.FirstName}</td>
              <td>{item.LastName}</td>
              <td>{item.MobileNo}</td>
              <td>{item.Gender}</td>
              <td>{item.Dob}</td>
              <td>{item.Pincode}</td>
              <td>{item.Department}</td>
              <td>{item.CurrentLocation}</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </>
  );
};


export default MainPage;
