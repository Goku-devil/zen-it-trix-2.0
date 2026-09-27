import { useState } from 'react'
import data from '../data.json'

export default function CollegeSelector({ value = '', onChange, disabled = false }) {
    const [selectedDistrict, setSelectedDistrict] = useState(() => {
        if (!value) return ''
        const found = data.districts.find((d) => d.colleges.includes(value))
        return found ? found.name : 'Other'
    })

    const [selectedCollege, setSelectedCollege] = useState(() => {
        if (!value) return ''
        const found = data.districts.find((d) => d.colleges.includes(value))
        return found ? value : 'Other'
    })

    const [customCollege, setCustomCollege] = useState(() => {
        if (!value) return ''
        const found = data.districts.find((d) => d.colleges.includes(value))
        return found ? '' : value
    })

    const handleDistrictChange = (event) => {
        const nextDistrict = event.target.value
        setSelectedDistrict(nextDistrict)

        if (nextDistrict === 'Other') {
            setSelectedCollege('Other')
            onChange(customCollege.trim())
        } else {
            setSelectedCollege('')
            onChange('')
        }
    }

    const handleCollegeChange = (event) => {
        const nextCollege = event.target.value
        setSelectedCollege(nextCollege)

        if (nextCollege === 'Other') {
            onChange(customCollege.trim())
        } else {
            onChange(nextCollege)
        }
    }

    const handleCustomCollegeChange = (event) => {
        const text = event.target.value
        setCustomCollege(text)
        onChange(text.trim().replace(/\s+/g, ' '))
    }

    const districtObj = data.districts.find((d) => d.name === selectedDistrict)
    const colleges = districtObj ? districtObj.colleges : []
    const isOtherDistrict = selectedDistrict === 'Other'
    const isOtherCollege = selectedCollege === 'Other'

    return (
        <div className="college-selector-container">
            <div className="registration-fields">
                <label>
                    District
                    <select
                        name="district"
                        value={selectedDistrict}
                        onChange={handleDistrictChange}
                        required
                        disabled={disabled}
                    >
                        <option value="">Choose a district</option>
                        {data.districts.map((d) => (
                            <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                        <option value="Other">Other / Outside listed</option>
                    </select>
                </label>

                {isOtherDistrict ? (
                    <label>
                        College / institution
                        <input
                            type="text"
                            name="customCollegeInput"
                            placeholder="Type your college / institution"
                            value={customCollege}
                            onChange={handleCustomCollegeChange}
                            required
                            disabled={disabled}
                            autoComplete="organization"
                        />
                    </label>
                ) : (
                    <label>
                        College / institution
                        <select
                            name="collegeSelect"
                            value={selectedCollege}
                            onChange={handleCollegeChange}
                            required={!isOtherCollege}
                            disabled={disabled || !selectedDistrict}
                        >
                            <option value="">{selectedDistrict ? 'Choose your college' : 'Select district first'}</option>
                            {colleges.map((col) => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                            {selectedDistrict && <option value="Other">Other / Not listed</option>}
                        </select>
                    </label>
                )}
            </div>

            {!isOtherDistrict && isOtherCollege && (
                <label>
                    Enter college / institution name
                    <input
                        type="text"
                        name="customCollegeInput"
                        placeholder="Type your college / institution name"
                        value={customCollege}
                        onChange={handleCustomCollegeChange}
                        required
                        disabled={disabled}
                        autoComplete="organization"
                    />
                </label>
            )}
        </div>
    )
}
