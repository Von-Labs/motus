// Claude Tool Definitions for Tapestry Social API

export const tapestryTools = [
  {
    name: 'create_social_post',
    description:
      'Create a new social post/content on Tapestry. Requires a profile ID (author) and content properties like title, body, image URL. Use when user wants to post something, share content, or create a social update.',
    input_schema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'The Tapestry profile ID of the author (content creator)'
        },
        title: {
          type: 'string',
          description: 'Title or headline of the post'
        },
        body: {
          type: 'string',
          description: 'Main text content of the post'
        },
        image: {
          type: 'string',
          description: 'Optional: URL of an image to attach to the post'
        }
      },
      required: ['profileId', 'title', 'body']
    }
  },
  {
    name: 'get_social_feed',
    description:
      'Get a list of social posts/content from Tapestry. Can filter by author profile. Use when user wants to see their feed, browse posts, or check what has been posted.',
    input_schema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'string',
          description: 'Optional: Filter posts by author profile ID'
        },
        page: {
          type: 'string',
          description: 'Optional: Page number for pagination (default: "1")'
        },
        pageSize: {
          type: 'string',
          description: 'Optional: Number of posts per page (default: "10")'
        }
      },
      required: []
    }
  },
  {
    name: 'get_post_details',
    description:
      'Get full details of a specific social post including comments and likes count. Use when user wants to see a specific post or its engagement.',
    input_schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'The Tapestry content/post ID'
        },
        requestingProfileId: {
          type: 'string',
          description: 'Optional: Profile ID of the viewer (to check if they liked it)'
        }
      },
      required: ['contentId']
    }
  },
  {
    name: 'comment_on_post',
    description:
      'Add a comment to a social post on Tapestry. Use when user wants to comment on or reply to a post.',
    input_schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'The content/post ID to comment on'
        },
        profileId: {
          type: 'string',
          description: 'The Tapestry profile ID of the commenter'
        },
        text: {
          type: 'string',
          description: 'The comment text'
        }
      },
      required: ['contentId', 'profileId', 'text']
    }
  },
  {
    name: 'get_post_comments',
    description:
      'Get comments on a specific social post. Use when user wants to read the discussion on a post.',
    input_schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'The content/post ID to get comments for'
        },
        page: {
          type: 'string',
          description: 'Optional: Page number for pagination'
        },
        pageSize: {
          type: 'string',
          description: 'Optional: Number of comments per page'
        }
      },
      required: ['contentId']
    }
  },
  {
    name: 'like_post',
    description:
      'Like a social post on Tapestry. Use when user wants to like or heart a post.',
    input_schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'The content/post ID to like'
        },
        profileId: {
          type: 'string',
          description: 'The Tapestry profile ID of the user liking the post'
        }
      },
      required: ['contentId', 'profileId']
    }
  },
  {
    name: 'unlike_post',
    description:
      'Remove a like from a social post on Tapestry. Use when user wants to unlike a post.',
    input_schema: {
      type: 'object',
      properties: {
        contentId: {
          type: 'string',
          description: 'The content/post ID to unlike'
        },
        profileId: {
          type: 'string',
          description: 'The Tapestry profile ID of the user unliking the post'
        }
      },
      required: ['contentId', 'profileId']
    }
  },
  {
    name: 'get_tapestry_profile',
    description:
      'Look up a Tapestry social profile by wallet address or profile ID. Use when user asks about a profile, or you need to find a profile ID for other operations.',
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Optional: Solana wallet address to look up profile for'
        },
        profileId: {
          type: 'string',
          description: 'Optional: Direct Tapestry profile ID to look up'
        }
      },
      required: []
    }
  }
]
