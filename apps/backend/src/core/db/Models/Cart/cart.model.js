const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      ////////////////// Edit this in the model ///////////////
      // FIX 1: removed sparse:true here — was creating a duplicate index
      // The schema.index() below already handles this correctly
      
    },
    guestToken: {
      type: String,
      default: null,
      //  removed sparse:true here — same reason as above
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

// Enforce one cart per authenticated user
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });

// Enforce one cart per guest token
cartSchema.index({ guestToken: 1 }, { unique: true, sparse: true });

// Application-level: exactly one of userId or guestToken must be set
// FIX 2: Mongoose v8 — pre-save via create() receives no next argument
// Changed from next(error) pattern to throw which works in all cases
cartSchema.pre('save', function () {
  if ((this.userId == null) === (this.guestToken == null)) {
    throw new Error('A cart must have either a userId or a guestToken, but not both.');
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
