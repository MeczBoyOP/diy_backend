    "use strict";
    const { Model } = require("sequelize");

    module.exports = (sequelize, DataTypes) => {
        class seo extends Model {
            static associate(models) {
                seo.belongsTo(models.user, {
                    foreignKey: "author_id",
                    as: "author",
                });

                seo.belongsTo(models.category, {
                    foreignKey: "category_id",
                    as: "category",
                });
            }
        }

        seo.init(
            {
                title: {
                    type: DataTypes.STRING(256),
                    allowNull: false,
                },
                slug: {
                    type: DataTypes.STRING(256),
                    allowNull: false,
                },
                meta_title: {
                    type: DataTypes.STRING(256),
                    allowNull: true,
                },
                meta_description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                meta_keywords: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                canonical_url: {
                    type: DataTypes.STRING(512),
                    allowNull: true,
                },
                og_title: {
                    type: DataTypes.STRING(256),
                    allowNull: true,
                },
                og_description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                og_image: {
                    type: DataTypes.STRING(512),
                    allowNull: true,
                },
                og_type: {
                    type: DataTypes.STRING(50),
                    defaultValue: "website",
                },
                robots: {
                    type: DataTypes.STRING(50),
                    defaultValue: "index, follow",
                },
                custom_head_scripts: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                custom_footer_scripts: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },

                google_cseid: {
                    type: DataTypes.STRING(128),
                    allowNull: true,
                },

                // Existing  fields
                author_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                category_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                json_ld:{
                    type:DataTypes.TEXT
                },
                // GEO (Generative Engine Optimization) fields
                ai_summary: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                    comment: "Short factual answer, ~1-2 sentences for AI extraction",
                },
                faq_section: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    comment: "Array of question + answer pairs for FAQ schema",
                },
                schema_type: {
                    type: DataTypes.ENUM('Article', 'FAQPage', 'Product', 'HowTo', 'BlogPosting', 'NewsArticle', 'WebPage', 'Organization', 'LocalBusiness'),
                    allowNull: true,
                    defaultValue: 'WebPage',
                    comment: "Schema.org type for structured data",
                },
                entities_keywords: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    comment: "List of key concepts for AI extraction",
                },
                page_type: {
                    type: DataTypes.ENUM('home', 'about', 'contact', 'services', 'products', 'blog', 'category', 'custom'),
                    allowNull: true,
                    defaultValue: 'custom',
                    comment: "Type of page for better categorization",
                }
            },
            {
                sequelize,
                modelName: "seo",
                paranoid: true,
                timestamps: true,
            }
        );

        return seo;
    };
