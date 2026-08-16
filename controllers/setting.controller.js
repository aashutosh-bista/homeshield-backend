import { Setting } from "../models/Setting.modle.js"

// Settings is treated as a singleton (one document for the whole site)
const getOrCreateSettings = async () => {
    let settings = await Setting.findOne()
    if (!settings) {
        settings = await Setting.create({})
    }
    return settings
}

// @desc   Get settings
// @route  GET /api/settings
export const getSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// @desc   Update top-level settings (companyName, address, map, socialLinks)
// @route  PUT /api/settings
export const updateSettings = async (req, res) => {
    try {
        const { phones, emails, ...rest } = req.body

        const settings = await getOrCreateSettings()
        Object.assign(settings, rest)
        await settings.save()

        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

/* ---------------------- Phones ---------------------- */

// @desc   Add a phone number
// @route  POST /api/settings/phones
export const addPhone = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        settings.phones.push(req.body) // { label, number, isPrimary }
        await settings.save()
        res.status(201).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// @desc   Edit a phone number by array index
// @route  PUT /api/settings/phones/:index
export const updatePhone = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        const index = Number(req.params.index)

        if (!settings.phones[index]) {
            return res.status(404).json({ success: false, message: "Phone entry not found" })
        }

        settings.phones[index] = { ...settings.phones[index].toObject(), ...req.body }
        settings.markModified("phones")
        await settings.save()

        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// @desc   Delete a phone number by array index
// @route  DELETE /api/settings/phones/:index
export const deletePhone = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        const index = Number(req.params.index)

        if (!settings.phones[index]) {
            return res.status(404).json({ success: false, message: "Phone entry not found" })
        }

        settings.phones.splice(index, 1)
        await settings.save()

        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

/* ---------------------- Emails ---------------------- */

// @desc   Add an email
// @route  POST /api/settings/emails
export const addEmail = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        settings.emails.push(req.body) // { label, address, isPrimary }
        await settings.save()
        res.status(201).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// @desc   Edit an email by array index
// @route  PUT /api/settings/emails/:index
export const updateEmail = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        const index = Number(req.params.index)

        if (!settings.emails[index]) {
            return res.status(404).json({ success: false, message: "Email entry not found" })
        }

        settings.emails[index] = { ...settings.emails[index].toObject(), ...req.body }
        settings.markModified("emails")
        await settings.save()

        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// @desc   Delete an email by array index
// @route  DELETE /api/settings/emails/:index
export const deleteEmail = async (req, res) => {
    try {
        const settings = await getOrCreateSettings()
        const index = Number(req.params.index)

        if (!settings.emails[index]) {
            return res.status(404).json({ success: false, message: "Email entry not found" })
        }

        settings.emails.splice(index, 1)
        await settings.save()

        res.status(200).json({ success: true, data: settings })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}