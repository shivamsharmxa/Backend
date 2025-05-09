import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const JobPost = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    area: "",
    description: "",
    requirements: "",
    jobCategory: "Technology",
    department: "Engineering",
    shift: "Day Shift",
    salary: {
      min: "",
      max: "",
      currency: "USD",
      period: "year",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("salary.")) {
      const salaryField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        salary: {
          ...prev.salary,
          [salaryField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert requirements from string to array and salary values to numbers
      const jobData = {
        ...formData,
        requirements: formData.requirements.split(",").map((req) => req.trim()),
        salary: {
          ...formData.salary,
          min: Number(formData.salary.min),
          max: Number(formData.salary.max),
        },
      };

      const response = await axios.post(
        "http://localhost:3002/api/jobs",
        jobData,
        {
          withCredentials: true,
        }
      );

      if (response.data) {
        toast.success("Job posted successfully!");
        navigate("/"); // Navigate back to home or jobs list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error posting job");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Salary
            </label>
            <input
              type="number"
              name="salary.min"
              value={formData.salary.min}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Salary
            </label>
            <input
              type="number"
              name="salary.max"
              value={formData.salary.max}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Area
          </label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requirements (comma-separated)
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            required
            rows="3"
            placeholder="e.g., 3+ years experience, Node.js, React"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Category
          </label>
          <select
            name="jobCategory"
            value={formData.jobCategory}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Shift
          </label>
          <select
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Day Shift">Day Shift</option>
            <option value="Night Shift">Night Shift</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Post Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPost;
