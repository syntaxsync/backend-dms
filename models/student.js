const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        min: 6,
        max: 20
    },
    batch: {
        type: String,
        required: [true, 'Batch is required'],
    },
    attemptedCreditHours: {
        type: Number,
        default: 0,
    },
    failedCreditHours: {
        type: Number,
        default: 0,
        validate: {
            validator: function () {
                return this.attemptedCreditHours >= this.failedCreditHours;
            },
            message: "Failed Credit Hours must be less than attempted courses"
        }
    }
});


studentSchema.virtual('passedCreditHours').get(function () {
    return this.attemptedCreditHours - this.failedCreditHours;
});


module.exports = studentSchema;