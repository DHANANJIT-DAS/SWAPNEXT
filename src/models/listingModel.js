'use strict';
import mongoose from "mongoose";


const locationSchema = new mongoose.Schema({
    address:  { 
        type: String, 
        required: true, 
        trim: true 
    },
    city:     { 
        type: String, 
        required: true, 
        trim: true, 
        index: true 
    },
    state:    { 
        type: String, 
        required: true, 
        trim: true 
    },
    pincode:  { 
        type: String, 
        required: true, 
        match: /^\d{6}$/ 
    },

    meetPref: {
        type: String,
        enum: ['Buyer visits seller', 'Seller delivers', 'Public meetup', 'Shipping only'],
        default: 'Buyer visits seller'
    },

    /* Map pin percentage coords (from draggable map) */
    pinX: { type: Number, min: 0, max: 100, default: 50 },
    pinY: { type: Number, min: 0, max: 100, default: 50 },

    /* Actual geo coords — populate via geocoding API when available */
    geo: {
        type:        { 
            type: String, 
            enum: ['Point'], 
            default: 'Point' 
        },
        coordinates: { 
            type: [Number], 
            default: [0, 0] 
        }
    }

}, { _id: false });


const listingSchema=new mongoose.Schema({

    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['electronics', 'vehicles', 'furniture', 'clothing','sports', 'books', 'art', 'tools', 'other'],
        index: true
    },

    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: ['Brand New', 'Like New', 'Good', 'Fair']
    },
    
    /* ── Step 2: Location ── */
    location: { type: locationSchema, required: true },
    
    /* ── Step 3: Details ── */
    title: {
        type:      String,
        required:  [true, 'Title is required'],
        trim:      true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [80, 'Title cannot exceed 80 characters'],
        index:     true
    },

    description: {
        type:      String,
        required:  [true, 'Description is required'],
        trim:      true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    brand:   { 
        type: String, 
        trim: true, 
        maxlength: 60, 
        default: "" 
    },

    yearAge: { 
        type: String, 
        trim: true, 
        maxlength: 40, 
        default: "" 
    },
    
    price: {
        type:     Number,
        required: [true, 'Price is required'],
        min:      [1, 'Price must be at least ₹1'],
        max:      [100000000, 'Price is too high'],
        index:    true
    },
    
    tags: {
        type: [String],
        validate: {
        validator: arr => arr.length <= 20,
        message:   'Maximum 20 tags allowed'
        },
        default: []
    },
    
    /* ── Step 4: Photos ── */
    photos: {
        type: [String],   /* filenames in /uploads — e.g. "uuid.jpg" */
        validate: {
        validator: arr => arr.length >= 1,
        message:   'At least 1 photo is required'
        },
        default: []
    },
    photosCount: { 
        type: Number, 
        default: 0 
    },
    
    /* ── Seller reference ── */
    seller: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'User',
        required: [true, 'Seller is required'],
        index:    true
    },
    
    /* ── Listing status ── */
    status: {
        type:    String,
        enum:    ['active', 'sold', 'reserved', 'draft', 'removed'],
        default: 'active',
        index:   true
    },
    soldAt:     { 
        type: Date,   
        default: null 
    },

    reservedFor:{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    
    /* ── Engagement stats ── */
    views: { 
        type: Number, 
        default: 0, 
        min: 0 
    },
    savedCount: { type: Number, default: 0, min: 0 },   /* denormalized */
    inquiries:  { type: Number, default: 0, min: 0 },
    
    /* ── Moderation ── */
    isApproved: { type: Boolean, default: true },   /* set false for manual review flow */
    isFlagged:  { type: Boolean, default: false },
    flagReason: { type: String,  default: '' },


},{timestamps:true});






/* 2dsphere for location-based ($near) queries */
listingSchema.index({ 'location.geo': '2dsphere' });
 
/* Compound indexes for the most common homepage queries */
listingSchema.index({ 'location.city': 1, category: 1, status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, price: 1 });
listingSchema.index({ seller: 1, status: 1 });
 
/* Text search index — powers the hero search bar */
listingSchema.index(
    { title: 'text', description: 'text', tags: 'text', brand: 'text' },
    { weights: { title: 10, tags: 5, brand: 4, description: 1 }, name: 'listing_text_search' }
);
 
/* ────────────────────────────────────────────────────────────
   VIRTUALS
   ──────────────────────────────────────────────────────────── */

/*URL of cover photo */
listingSchema.virtual('coverPhotoUrl').get(function () {
  return this.photos && this.photos.length > 0 ? this.photos[0] : null;
});
 
/* Human-readable time ago — used on listing cards */
listingSchema.virtual('timeAgo').get(function () {
    if (!this.createdAt) return '';
    const diff = Date.now() - this.createdAt.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return 'Just now';
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)   return `${d}d ago`;
    const w = Math.floor(d / 7);
    if (w < 5)   return `${w}w ago`;
    return this.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
});
 
/* Short city+state display */
listingSchema.virtual('locationDisplay').get(function () {
    if (!this.location) return '';
    return `${this.location.city}, ${this.location.state}`;
});
 
/* ────────────────────────────────────────────────────────────
    PRE-SAVE HOOKS
──────────────────────────────────────────────────────────── */
 
/* Keep photosCount in sync */
listingSchema.pre('save', function (next) {
    this.photosCount = this.photos ? this.photos.length : 0;
    next();
});
 
/* Normalise tags: lowercase, trim, deduplicate */
listingSchema.pre('save', function (next) {
    if (this.isModified('tags')) {
        this.tags = [...new Set(this.tags.map(t => t.toLowerCase().trim()).filter(Boolean))];
    }
    next();
});
 
/* Set soldAt timestamp automatically */
listingSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'sold' && !this.soldAt) {
        this.soldAt = new Date();
    }
    next();
});
 
/* ────────────────────────────────────────────────────────────
STATIC METHODS
──────────────────────────────────────────────────────────── */
    
/*
 * Homepage query — filter by category + city + sort + pagination
 * Used by GET / and GET /api/listings
 */
listingSchema.statics.getHomepageListings = async function ({
    category = 'all',
    city     = 'all',
    sort     = 'newest',
    q        = '',
    page     = 1,
    perPage  = 12
    } = {}) {

        const filter = { status: 'active', isApproved: true };
            
        if (category && category !== 'all') filter.category = category;
        if (city     && city     !== 'all') filter['location.city'] = new RegExp(`^${city}$`, 'i');
            
        /* Full-text search */
        let query;
        if (q.trim()) {
            query = this.find({ ...filter, $text: { $search: q } }, { score: { $meta: 'textScore' } });
            if (sort === 'newest') query = query.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
        } 
        else {
            query = this.find(filter);
        }
            
        /* Sort */
        if (!q.trim()) {
            if (sort === 'price-asc')  query = query.sort({ price:  1 });
            else if (sort === 'price-desc') query = query.sort({ price: -1 });
            else                            query = query.sort({ createdAt: -1 });
        }
            
        const totalCount = await this.countDocuments(filter);
        const listings   = await query
            .skip((page - 1) * perPage)
            .limit(perPage)
            .select('title description category condition location price photos photosCount seller createdAt views savedCount tags brand')
            .populate('seller', 'name avatar city')
            .lean({ virtuals: true });
            
        return {
            listings,
            totalCount,
            hasMore:     (page - 1) * perPage + listings.length < totalCount,
            currentPage: page
        };
};
 
    
listingSchema.statics.incrementViews = function (productId) {
    return this.findByIdAndUpdate(productId, { $inc: { views: 1 } }, { returnDocument: 'before' });
};
 
/* ────────────────────────────────────────────────────────────
INSTANCE METHODS
──────────────────────────────────────────────────────────── */
    
/* Mark as sold */
listingSchema.methods.markSold = function () {
    this.status = 'sold';
    this.soldAt = new Date();
    return this.save();
};






const Listing=mongoose.model("Listing",listingSchema);

export default Listing;