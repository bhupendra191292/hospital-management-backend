import React, { useEffect, useState } from "react";
import {
  getDoctors,
  updateDoctor,
  deleteDoctor,
} from "../services/api";

const SPECIALIZATIONS = [
  "General",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Pediatrician",
  "Orthopedic",
  "Gynecologist",
  "Oncologist",
  "Other",
];

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [customSpecialization, setCustomSpecialization] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res.data);
    } catch {
      alert("Failed to load doctors");
    }
  };

  const handleEdit = (doctor) => {
    setEditing(doctor._id);
    setForm({
      name: doctor.name,
      specialization: SPECIALIZATIONS.includes(doctor.specialization)
        ? doctor.specialization
        : "Other",
      role: doctor.role || "doctor", // default fallback
    });
    if (!SPECIALIZATIONS.includes(doctor.specialization)) {
      setCustomSpecialization(doctor.specialization);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({});
    setCustomSpecialization("");
  };

  const handleSave = async () => {
    const specialization =
      form.specialization === "Other"
        ? customSpecialization.trim()
        : form.specialization;

    const payload = {
      name: form.name,
      specialization,
      role: form.role,
    };

    try {
      await updateDoctor(editing, payload);
      handleCancel();
      fetchDoctors();
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      fetchDoctors();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <h3>🧑‍⚕️ Manage Doctors</h3>
      {doctors.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ width: "100%", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Specialization</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr key={doc._id}>
                <td>
                  {editing === doc._id ? (
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  ) : (
                    doc.name
                  )}
                </td>
                <td>{doc.phone}</td>
                <td>
                  {editing === doc._id ? (
                    <div>
                      <select
                        value={form.specialization}
                        onChange={(e) => {
                          setForm({ ...form, specialization: e.target.value });
                          if (e.target.value !== "Other") {
                            setCustomSpecialization("");
                          }
                        }}
                      >
                        {SPECIALIZATIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                      {form.specialization === "Other" && (
                        <input
                          style={{ marginTop: "5px", width: "100%" }}
                          placeholder="Custom specialization"
                          value={customSpecialization}
                          onChange={(e) =>
                            setCustomSpecialization(e.target.value)
                          }
                        />
                      )}
                    </div>
                  ) : (
                    doc.specialization
                  )}
                </td>
                <td>
                  {editing === doc._id ? (
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    doc.role
                  )}
                </td>
                <td>
                  {editing === doc._id ? (
                    <>
                      <button onClick={handleSave}>💾 Save</button>
                      <button onClick={handleCancel}>❌ Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(doc)}>✏️ Edit</button>
                      <button onClick={() => handleDelete(doc._id)}>
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageDoctors;
