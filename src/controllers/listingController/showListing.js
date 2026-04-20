"use strict";
import Listing from "../../models/listingModel.js";
import { parseQuery, fetchHeroStats} from "../../utils/helperFunctions.js";



/** Format year from a User createdAt date → "Jan 2023" */
function memberSince(date) {
	if (!date) return '—';
	return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Escape regex meta chars in a string */
function escapeRegex(str) {
  	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getAllListings = async function (req,res){

    try {


		const params = parseQuery(req.query);
	
		const [result, stats] = await Promise.all([
			Listing.getHomepageListings({
				category : params.category,
				city     : params.city,
				sort     : params.sort,
				q        : params.q,
				page     : params.page,
				perPage  : 12,
			}),
			fetchHeroStats(),
		]);
	
	
		
	
		return res.render("./listingView/showListing/homePage.ejs", {
	
			listings:    result.listings,
			totalCount  : result.totalCount,
			hasMore     : result.hasMore,
			currentPage : result.currentPage,
		
			/* active filter state — EJS marks selected pills/selects */
			selectedCategory : params.category,
			selectedCity     : params.city,
			sortBy           : params.sort,
			searchQuery      : params.q,
		
			/* hero stat cards */
			stats,
		
			/* auth — adjust to your middleware (Passport / express-session) */
			currUser   : req.user || req.session?.user || null,
		
			/* page meta */
			activePage : "home",
		
		});
 
	} catch (err) {

		console.error('[HOME] GET / error :', err);
		
		/* Graceful degradation — render empty state, never 500-crash */
		return res.status(500).render("./listingView/showListing/homePage.ejs", {
			listings         : [],
			totalCount       : 0,
			hasMore          : false,
			currentPage      : 1,
			selectedCategory : 'all',
			selectedCity     : 'all',
			sortBy           : 'newest',
			searchQuery      : '',
			stats            : { listings: '—', cities: '—', sold: '—', users: '—' },
			currUser         : req.user || req.session?.user || null,
			activePage       : 'home',
		});
	}
    
    
}



const getOneListingDetails = async function (req,res){


	try{

		const listing = await Listing.findById(req.params.id).populate("seller", "name avatar city createdAt").exec();

		/* 404 — not found or removed */
		if (!listing || listing.status === 'removed' || !listing.isApproved) {
			return res.status(404).render("./errorPages/404.ejs", {
				message   : "This listing could not be found.",
				currUser  : req.user || req.session?.user || null,
				activePage: "",
			});
		}

		const listingObj = listing.toObject({ virtuals: true });

		Listing.incrementViews(listing._id).catch(err =>
			  console.warn('[listing] incrementViews error:', err.message)
		);


		/* ── Similar prices for the price chart ── */
		/* Fetch prices of up to 30 active listings in the same category + city */

		const similarRaw = await Listing
			.find({
				_id      : { $ne: listing._id },
				category : listing.category,
				'location.city': { $regex: new RegExp(`^${escapeRegex(listing.location.city)}$`, 'i') },
				status   : 'active',
				isApproved: true,
			})
			.select("price")
			.limit(30)
			.lean();


		const similarPrices = similarRaw.map(p => p.price);



		/* ── Related listings (3 cards shown below the map) ── */
		const relatedDocs = await Listing
			.find({
				_id      : { $ne: listing._id },
				category : listing.category,
				'location.city': { $regex: new RegExp(`^${escapeRegex(listing.location.city)}$`, 'i') },
				status   : 'active',
				isApproved: true,
			})
			.sort({ createdAt: -1 })
			.limit(3)
			.select('title price photos photosCount condition createdAt')
			.exec();




		 /* ── VIRTUAL: apply virtuals to each related doc ── */
		const related = relatedDocs.map(doc => {
			const obj = doc.toObject({ virtuals: true });
			return {
				id           : obj._id.toString(),
				title        : obj.title,
				price        : obj.price,
				condition    : obj.condition,
				photos       : obj.photos,
				coverPhotoUrl: obj.coverPhotoUrl,   /* virtual */
				timeAgo      : obj.timeAgo,          /* virtual */
			};
		});


		/* ── Seller stats ── */
		let sellerStats = null;

		if (listing.seller) {
			const [activeCount, soldCount] = await Promise.all([
				Listing.countDocuments({ seller: listing.seller._id, status: 'active', isApproved: true }),
				Listing.countDocuments({ seller: listing.seller._id, status: 'sold' }),
			]);
			sellerStats = {
				activeListings: activeCount,
				totalSold     : soldCount,
				memberSince   : memberSince(listing.seller.createdAt),
			};
		}


		/* ── Is the listing saved by the current user? ── */
		const currUser = req.user || req.session?.user || null;
		const isSaved  = currUser && currUser.savedListings ? currUser.savedListings.some(id => id.toString() === listing._id.toString()) : false;

		return res.render("./listingView/showListing/showOneListing.ejs", {
			listing      : listingObj,   /* includes all virtuals */
			related,
			similarPrices,
			sellerStats,
			isSaved,
			currUser,
			activePage   : '',
			title        : `${listingObj.title} — SwapNext`,
		});


	}catch(error){


		/* Invalid ObjectId format → 404 */
		if (error.name === 'CastError') {
			return res.status(404).render("./errorPages/404.ejs", {
				message   : 'Invalid listing ID.',
				currUser  : req.user || req.session?.user || null,
				activePage: '',
			});
		}

		console.error('[listing] GET /listings/:id error:', error);

		return res.status(500).render("./errorPages/error.ejs", {
			message   : 'Could not load this listing. Please try again shortly.',
			currUser  : req.user || req.session?.user || null,
			activePage: '',
		});


	}


}




export {getAllListings,getOneListingDetails};