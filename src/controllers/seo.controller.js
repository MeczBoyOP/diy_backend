"use strict";
const expressAsyncHandler = require("express-async-handler");
const db = require("../models/index.js");
const {
    serverErrorResponse,
    successResponse,
    notFoundResponse,
} = require("../utils/response.js");
const verifyToken = require("../middleware/auth.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const deleteFile = require("../utils/deletefile.js");
const { where, col, fn, Op } = require("sequelize")

const SeoController = {};

// Create SEO
SeoController.create = [
    verifyToken,
    upload.single("og_image"),
    expressAsyncHandler(async (req, res) => {
        try {
            const { title, slug, category_slug } = req.body;
            const author_id = req.user.id;
            const obj = { ...req.body };

            // Process GEO fields
            if (req.body.faq_section) {
                try {
                    obj.faq_section = JSON.parse(req.body.faq_section);
                } catch (error) {
                    return successResponse(res, {
                        status: false,
                        message: "Invalid FAQ section format",
                    });
                }
            }

            if (req.body.entities_keywords) {
                try {
                    obj.entities_keywords = JSON.parse(req.body.entities_keywords);
                } catch (error) {
                    return successResponse(res, {
                        status: false,
                        message: "Invalid entities/keywords format",
                    });
                }
            }


            if (!(title && slug && category_slug)) {
                return successResponse(res, {
                    status: false,
                    message: "Please fill all required fields",
                });
            }
            const findCategory = await db.category.findOne({ where: { slug: category_slug } })
            // console.log(findCategory, "ggg")

            if (!findCategory) {
                return successResponse(res, {
                    status: false,
                    message: "category not found",
                });
            }

            obj.category_id = findCategory?.id

            const findAuthor = await db.user.findByPk(author_id);
            if (!findAuthor) {
                return successResponse(res, {
                    status: false,
                    message: "Author not found",
                });
            }



            const seoExists = await db.seo.findOne({
                where: { slug },
            });
            if (seoExists) {
                return successResponse(res, {
                    status: false,
                    message: "Slug already exists",
                });
            }

            if (req.file) {
                obj.og_image = req.file.path;
            }

            obj.author_id = author_id;
            console.log(findCategory.slug, "findCategory.slug ")

            const seo = await db.seo.create(obj);
            await db.category.update(
                { slug: seo.slug },
                { where: { id: findCategory.id } }
            );

            // Fetch fresh SEO entry to ensure latest data
            const populatedSeo = await db.seo.findOne({
                where: { id: seo.id },
                include: [
                    {
                        model: db.category,
                        as: 'category',
                        include: [
                            {
                                model: db.category,
                                as: 'parent'
                            }
                        ]
                    }
                ]
            });


            return successResponse(res, {
                status: true,
                message: "SEO entry created successfully",
                data: populatedSeo,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Get All SEO Entries
SeoController.getAll = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            const seoEntries = await db.seo.findAll({
                where: {},
                include: [
                    { model: db.user, as: "author", },
                    { model: db.category, as: "category", attributes: ["id", "name", "slug"] },
                ],
            });

            return successResponse(res, {
                status: true,
                data: seoEntries,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Get SEO by Slug
SeoController.getBySlug = [
    
    expressAsyncHandler(async (req, res) => {
        try {
            const { slug } = req.params;
            const seo = await db.seo.findOne({
                where: { slug },
                include: [
                    { model: db.category, as: "category" },
                ],
            });

            if (!seo) return successResponse(res, {
                status: false,
                message: "seo not found",
            });;


            return successResponse(res, {
                status: true,
                data: seo,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];
// Get SEO entries by case-insensitive category.name


SeoController.getByCategoryName = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            const { name } = req.params;

            const seoEntries = await db.seo.findOne({
                include: [
                    {
                        model: db.category,
                        as: "category",
                        where: where(fn("LOWER", col("category.name")), name.toLowerCase()),
                    },
                    {
                        model: db.user,
                        as: "author",
                    },
                ],
            });

            if (!seoEntries) {
                return successResponse(res, {
                    status: false,
                    message: "Seo not found",
                });;
            }

            return successResponse(res, {
                status: true,
                data: seoEntries,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];
// Update SEO by Slug
SeoController.update = [
    verifyToken,
    upload.single("og_image"),
    expressAsyncHandler(async (req, res) => {
        try {
            const { slug } = req.params;
            const obj = { ...req.body };

            // Process GEO fields
            if (req.body.faq_section) {
                try {
                    obj.faq_section = JSON.parse(req.body.faq_section);
                } catch (error) {
                    return successResponse(res, {
                        status: false,
                        message: "Invalid FAQ section format",
                    });
                }
            }

            if (req.body.entities_keywords) {
                try {
                    obj.entities_keywords = JSON.parse(req.body.entities_keywords);
                } catch (error) {
                    return successResponse(res, {
                        status: false,
                        message: "Invalid entities/keywords format",
                    });
                }
            }

            const seo = await db.seo.findOne({
                where: { slug }
                ,
            });

            if (!seo) return successResponse(res, {
                status: false,
                message: "seo  not found",
            });



            if (req.body.slug && req.body.slug !== slug) {
                const existing = await db.seo.findOne({
                    where: {
                        [Op.and]: [
                            { id: { [Op.ne]: seo.id } },
                            { slug: req.body.slug },
                        ],
                    },
                });
                if (existing) {
                    return successResponse(res, {
                        status: false,
                        message: "Slug already exists",
                    });
                }
            }
            const findCategory = await db.category.findOne({ where: { slug: slug } })

            console.log(findCategory, "---------")


            if (req.file) {
                obj.og_image = req.file.path;
                if (seo.og_image) deleteFile(seo.og_image);
            }

            await seo.update(obj);





            await db.category.update(
                { slug: req.body.slug },
                { where: { id: findCategory.id } }
            );

            // Fetch fresh SEO entry to ensure latest data
            const populatedSeo = await db.seo.findOne({
                where: { id: seo.id },
                include: [
                    {
                        model: db.category,
                        as: 'category',
                        include: [
                            {
                                model: db.category,
                                as: 'parent'
                            }
                        ]
                    }
                ]
            });

            return successResponse(res, {
                status: true,
                message: "SEO entry updated successfully",
                data: populatedSeo,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Delete SEO
SeoController.delete = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            const { slug } = req.params;
            const seo = await db.seo.findOne({ where: { slug } });

            if (!seo) return successResponse(res, {
                status: false,
                message: "seo not found",
            });;

            if (seo.og_image) deleteFile(seo.og_image);
            await db.seo.destroy({ where: { slug } });

            return successResponse(res, {
                status: true,
                message: "SEO entry deleted successfully",
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Get SEO by Page Type
SeoController.getByPageType = [
    expressAsyncHandler(async (req, res) => {
        try {
            const { page_type } = req.params;
            
            const seo = await db.seo.findOne({
                where: { page_type },
                include: [
                    { model: db.category, as: "category" },
                    { model: db.user, as: "author" },
                ],
            });

            if (!seo) return successResponse(res, {
                status: false,
                message: "SEO not found for this page type",
            });

            return successResponse(res, {
                status: true,
                data: seo,
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Get All SEO Entries with Pagination and Filters
SeoController.getAllWithFilters = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                page_type, 
                schema_type, 
                search,
                sort_by = 'createdAt',
                sort_order = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            const where = {};

            // Add filters
            if (page_type) {
                where.page_type = page_type;
            }

            if (schema_type) {
                where.schema_type = schema_type;
            }

            if (search) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { slug: { [Op.like]: `%${search}%` } },
                    { meta_title: { [Op.like]: `%${search}%` } },
                    { ai_summary: { [Op.like]: `%${search}%` } }
                ];
            }

            const { count, rows } = await db.seo.findAndCountAll({
                where,
                include: [
                    { model: db.user, as: "author", attributes: ["id", "name", "email"] },
                    { model: db.category, as: "category", attributes: ["id", "name", "slug"] },
                ],
                order: [[sort_by, sort_order]],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            return successResponse(res, {
                status: true,
                data: {
                    seo_entries: rows,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(count / limit),
                        total_items: count,
                        items_per_page: parseInt(limit)
                    }
                },
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Bulk Update SEO Entries
SeoController.bulkUpdate = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            const { updates } = req.body; // Array of { id, updates } objects

            if (!Array.isArray(updates) || updates.length === 0) {
                return successResponse(res, {
                    status: false,
                    message: "No updates provided",
                });
            }

            const results = [];
            const errors = [];

            for (const update of updates) {
                try {
                    const { id, ...updateData } = update;
                    
                    // Process GEO fields if present
                    if (updateData.faq_section) {
                        try {
                            updateData.faq_section = JSON.parse(updateData.faq_section);
                        } catch (error) {
                            errors.push({ id, error: "Invalid FAQ section format" });
                            continue;
                        }
                    }

                    if (updateData.entities_keywords) {
                        try {
                            updateData.entities_keywords = JSON.parse(updateData.entities_keywords);
                        } catch (error) {
                            errors.push({ id, error: "Invalid entities/keywords format" });
                            continue;
                        }
                    }

                    const seo = await db.seo.findByPk(id);
                    if (!seo) {
                        errors.push({ id, error: "SEO entry not found" });
                        continue;
                    }

                    await seo.update(updateData);
                    results.push({ id, status: "updated" });
                } catch (error) {
                    errors.push({ id: update.id, error: error.message });
                }
            }

            return successResponse(res, {
                status: true,
                message: `Bulk update completed. ${results.length} updated, ${errors.length} failed.`,
                data: {
                    successful: results,
                    errors: errors
                },
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Get SEO Analytics (for GEO performance tracking)
SeoController.getAnalytics = [
    verifyToken,
    expressAsyncHandler(async (req, res) => {
        try {
            // Count by page type
            const pageTypeStats = await db.seo.findAll({
                attributes: [
                    'page_type',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['page_type'],
                raw: true
            });

            // Count by schema type
            const schemaTypeStats = await db.seo.findAll({
                attributes: [
                    'schema_type',
                    [fn('COUNT', col('id')), 'count']
                ],
                group: ['schema_type'],
                raw: true
            });

            // Count entries with GEO fields
            const geoStats = await db.seo.findAll({
                attributes: [
                    [fn('COUNT', col('id')), 'total_entries'],
                    [fn('COUNT', col('ai_summary')), 'with_ai_summary'],
                    [fn('COUNT', col('faq_section')), 'with_faq'],
                    [fn('COUNT', col('entities_keywords')), 'with_keywords']
                ],
                raw: true
            });

            return successResponse(res, {
                status: true,
                data: {
                    page_type_distribution: pageTypeStats,
                    schema_type_distribution: schemaTypeStats,
                    geo_field_usage: geoStats[0]
                },
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

// Generate JSON-LD Schema for SEO Entry
SeoController.generateJSONLD = [
    expressAsyncHandler(async (req, res) => {
        try {
            const { slug } = req.params;
            const seo = await db.seo.findOne({
                where: { slug },
                include: [
                    { model: db.category, as: "category" },
                    { model: db.user, as: "author" },
                ],
            });

            if (!seo) {
                return successResponse(res, {
                    status: false,
                    message: "SEO entry not found",
                });
            }

            // Generate JSON-LD schema based on GEO fields
            const baseSchema = {
                "@context": "https://schema.org",
                "@type": seo.schema_type || "WebPage",
                "headline": seo.title,
                "description": seo.ai_summary || seo.meta_description,
                "url": seo.canonical_url || `${req.protocol}://${req.get('host')}/${seo.slug}`,
                "publisher": {
                    "@type": "Organization",
                    "name": "DIY PreFab Solutions",
                    "url": `${req.protocol}://${req.get('host')}`
                }
            };

            // Add keywords if available
            if (seo.entities_keywords && seo.entities_keywords.length > 0) {
                baseSchema.keywords = seo.entities_keywords.join(', ');
            }

            // Add image if available
            if (seo.og_image) {
                baseSchema.image = {
                    "@type": "ImageObject",
                    "url": seo.og_image.startsWith('http') ? seo.og_image : `${req.protocol}://${req.get('host')}/${seo.og_image}`,
                    "width": 1200,
                    "height": 630
                };
            }

            // Generate FAQ schema if FAQ section exists
            let schemas = [baseSchema];
            if (seo.faq_section && seo.faq_section.length > 0) {
                const faqSchema = {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": seo.faq_section.map(faq => ({
                        "@type": "Question",
                        "name": faq.question,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": faq.answer
                        }
                    }))
                };
                schemas.push(faqSchema);
            }

            return successResponse(res, {
                status: true,
                data: {
                    seo_entry: seo,
                    json_ld_schemas: schemas
                },
            });
        } catch (error) {
            console.error(error);
            return serverErrorResponse(res, error);
        }
    }),
];

module.exports = SeoController;
