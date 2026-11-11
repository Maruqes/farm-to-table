// Contract types (CT-01 … CT-27) as OpenAPI 3.0 schemas, each defined once.
// Shapes and status codes come from `.tickets/contract/`; nothing is invented here.

const CATEGORY = {
  type: 'string',
  enum: ['vegetables', 'fruit', 'honey', 'wine', 'cheese', 'bakery'],
};

const SEASON = {
  type: 'string',
  enum: ['spring', 'summer', 'autumn', 'winter', 'all-year'],
};

const UNIT = {
  type: 'string',
  enum: ['kg', 'bunch', 'jar', 'bottle', 'wheel', 'loaf'],
};

const ORDER_STATUS = {
  type: 'string',
  enum: ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'],
};

export const schemas: Record<string, unknown> = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Invalid request data' },
          fields: {
            type: 'object',
            additionalProperties: { type: 'string' },
            example: { email: 'Already registered' },
          },
        },
      },
    },
  },

  // CT-01
  User: {
    type: 'object',
    required: ['id', 'name', 'email', 'role'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['buyer', 'producer', 'admin'] },
      producerStatus: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
    },
  },
  AuthResponse: {
    type: 'object',
    required: ['user', 'token'],
    properties: {
      user: { $ref: '#/components/schemas/User' },
      token: { type: 'string', description: 'JWT, expires in 2h' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', description: 'min 8 chars' },
      role: { type: 'string', enum: ['buyer', 'producer'] },
      farmName: { type: 'string', description: 'required when role is producer' },
      locality: { type: 'string', description: 'required when role is producer' },
    },
  },

  // CT-03
  ProducerSummary: {
    type: 'object',
    required: ['id', 'name', 'location'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      location: { type: 'string' },
    },
  },
  ProductListItem: {
    type: 'object',
    required: ['id', 'name', 'price', 'unit', 'stock', 'category', 'producer', 'averageRating'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number', example: 12.5 },
      unit: { type: 'string' },
      stock: { type: 'integer' },
      category: CATEGORY,
      imageUrl: { type: 'string' },
      producer: { $ref: '#/components/schemas/ProducerSummary' },
      averageRating: { type: 'number' },
    },
  },
  AuctionSummary: {
    type: 'object',
    required: ['id', 'product', 'currentPrice', 'endsAt'],
    properties: {
      id: { type: 'string' },
      product: {
        type: 'object',
        required: ['id', 'name', 'category'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
        },
      },
      currentPrice: { type: 'number' },
      endsAt: { type: 'string', format: 'date-time' },
    },
  },

  // CT-04
  Review: {
    type: 'object',
    required: ['id', 'author', 'rating', 'text', 'date'],
    properties: {
      id: { type: 'string' },
      author: { type: 'string' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      text: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
    },
  },
  ProductDetail: {
    type: 'object',
    required: [
      'id',
      'name',
      'price',
      'unit',
      'stock',
      'category',
      'producer',
      'averageRating',
      'description',
      'reviews',
    ],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      unit: { type: 'string' },
      stock: { type: 'integer' },
      category: CATEGORY,
      imageUrl: { type: 'string' },
      producer: { $ref: '#/components/schemas/ProducerSummary' },
      averageRating: { type: 'number' },
      description: { type: 'string' },
      reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
    },
  },

  // CT-05
  ProducerProduct: {
    type: 'object',
    required: ['id', 'name', 'price', 'unit', 'stock', 'category', 'averageRating'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      unit: { type: 'string' },
      stock: { type: 'integer' },
      category: CATEGORY,
      imageUrl: { type: 'string' },
      averageRating: { type: 'number' },
    },
  },
  ProducerPublic: {
    type: 'object',
    required: ['id', 'name', 'bio', 'location', 'averageRating', 'products'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      bio: { type: 'string' },
      location: { type: 'string' },
      lat: { type: 'number' },
      lng: { type: 'number' },
      averageRating: { type: 'number' },
      products: { type: 'array', items: { $ref: '#/components/schemas/ProducerProduct' } },
    },
  },

  // CT-06
  CartItem: {
    type: 'object',
    required: ['productId', 'name', 'price', 'quantity', 'unit', 'stock', 'category', 'producer'],
    properties: {
      productId: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      quantity: { type: 'integer' },
      unit: { type: 'string' },
      stock: { type: 'integer' },
      category: CATEGORY,
      imageUrl: { type: 'string' },
      producer: {
        type: 'object',
        required: ['id', 'name', 'location'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string' },
        },
      },
    },
  },
  Cart: {
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
    },
  },
  SaveCartRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
  },

  // CT-07
  Address: {
    type: 'object',
    required: ['line1', 'city', 'postalCode'],
    properties: {
      line1: { type: 'string' },
      city: { type: 'string' },
      postalCode: { type: 'string' },
    },
  },
  OrderItem: {
    type: 'object',
    required: ['productId', 'name', 'price', 'quantity', 'unit'],
    properties: {
      productId: { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number' },
      quantity: { type: 'integer' },
      unit: { type: 'string' },
    },
  },
  Order: {
    type: 'object',
    required: ['id', 'producer', 'status', 'items', 'total'],
    properties: {
      id: { type: 'string' },
      producer: {
        type: 'object',
        required: ['id', 'name', 'location'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string' },
        },
      },
      status: ORDER_STATUS,
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      total: { type: 'number' },
    },
  },
  CheckoutRequest: {
    type: 'object',
    required: ['fulfilment'],
    properties: {
      fulfilment: { type: 'string', enum: ['pickup', 'delivery'] },
      address: { $ref: '#/components/schemas/Address' },
    },
  },

  // CT-08
  MyOrder: {
    type: 'object',
    required: ['id', 'status', 'history', 'producer', 'items', 'total', 'reviewed'],
    properties: {
      id: { type: 'string' },
      status: ORDER_STATUS,
      history: {
        type: 'array',
        items: {
          type: 'object',
          required: ['status', 'date'],
          properties: {
            status: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
          },
        },
      },
      producer: {
        type: 'object',
        required: ['id', 'name', 'location'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          location: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
        },
      },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      total: { type: 'number' },
      reviewed: { type: 'boolean' },
      review: {
        type: 'object',
        nullable: true,
        properties: {
          rating: { type: 'integer' },
          text: { type: 'string' },
        },
      },
    },
  },
  CreateReviewRequest: {
    type: 'object',
    required: ['orderId', 'rating'],
    properties: {
      orderId: { type: 'string' },
      rating: { type: 'integer', minimum: 1, maximum: 5 },
      text: { type: 'string', description: 'trimmed, max 500 chars' },
    },
  },
  CreatedReview: {
    type: 'object',
    required: ['id', 'orderId', 'rating', 'text', 'createdAt'],
    properties: {
      id: { type: 'string' },
      orderId: { type: 'string' },
      rating: { type: 'integer' },
      text: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  // CT-09
  Notification: {
    type: 'object',
    required: ['id', 'type', 'text', 'date', 'read'],
    properties: {
      id: { type: 'string' },
      type: {
        type: 'string',
        enum: [
          'order-status-changed',
          'order-new',
          'auction-won',
          'auction-skipped',
          'producer-approved',
          'producer-rejected',
          'product-hidden',
        ],
      },
      text: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      read: { type: 'boolean' },
    },
  },
  MarkReadRequest: {
    type: 'object',
    required: ['read'],
    properties: { read: { type: 'boolean', enum: [true] } },
  },

  // CT-10
  Card: {
    type: 'object',
    required: ['last4', 'holder', 'expiry', 'simulateInvalid'],
    properties: {
      last4: { type: 'string' },
      holder: { type: 'string' },
      expiry: { type: 'string', example: '12/28' },
      simulateInvalid: { type: 'boolean' },
    },
  },
  Profile: {
    type: 'object',
    required: ['id', 'name', 'email', 'address', 'card'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      address: { type: 'string' },
      card: {
        nullable: true,
        allOf: [{ $ref: '#/components/schemas/Card' }],
      },
    },
  },
  UpdateProfileRequest: {
    type: 'object',
    required: ['name', 'email', 'address'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      address: { type: 'string' },
    },
  },
  UpdateCardRequest: {
    type: 'object',
    required: ['number', 'holder', 'expiry', 'simulateInvalid'],
    properties: {
      number: { type: 'string', example: '4111 1111 1111 1111' },
      holder: { type: 'string' },
      expiry: { type: 'string', example: '12/28' },
      simulateInvalid: { type: 'boolean' },
    },
  },

  // CT-11
  AuctionBid: {
    type: 'object',
    required: ['id', 'amount', 'name', 'bidderId', 'date'],
    properties: {
      id: { type: 'string' },
      amount: { type: 'number' },
      name: { type: 'string' },
      bidderId: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
    },
  },
  AuctionRoom: {
    type: 'object',
    required: [
      'id',
      'status',
      'product',
      'producer',
      'quantity',
      'unit',
      'basePrice',
      'increment',
      'currentPrice',
      'startsAt',
      'endsAt',
      'bids',
      'viewerCount',
    ],
    properties: {
      id: { type: 'string' },
      status: { type: 'string', enum: ['scheduled', 'active', 'ended'] },
      product: {
        type: 'object',
        required: ['id', 'name', 'category'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
        },
      },
      producer: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      quantity: { type: 'integer' },
      unit: { type: 'string' },
      basePrice: { type: 'number' },
      increment: { type: 'number' },
      currentPrice: { type: 'number' },
      leader: {
        type: 'object',
        nullable: true,
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      startsAt: { type: 'string', format: 'date-time' },
      endsAt: { type: 'string', format: 'date-time' },
      bids: { type: 'array', items: { $ref: '#/components/schemas/AuctionBid' } },
      viewerCount: { type: 'integer' },
      winner: {
        type: 'object',
        nullable: true,
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
    },
  },
  PlaceBidRequest: {
    type: 'object',
    required: ['amount'],
    properties: { amount: { type: 'number' } },
  },

  // CT-12
  ProducerStats: {
    type: 'object',
    required: ['sales', 'toHandle', 'activeProducts', 'averageRating', 'salesPerDay', 'byStatus', 'lowStock'],
    properties: {
      sales: { type: 'number' },
      toHandle: { type: 'integer' },
      activeProducts: { type: 'integer' },
      averageRating: { type: 'number' },
      salesPerDay: {
        type: 'array',
        items: {
          type: 'object',
          required: ['day', 'total'],
          properties: { day: { type: 'string' }, total: { type: 'number' } },
        },
      },
      byStatus: { type: 'object', additionalProperties: { type: 'integer' } },
      lowStock: {
        type: 'array',
        items: {
          type: 'object',
          required: ['productId', 'name', 'stock'],
          properties: {
            productId: { type: 'string' },
            name: { type: 'string' },
            stock: { type: 'integer' },
          },
        },
      },
      activeAuction: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          product: {
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' } },
          },
          currentPrice: { type: 'number' },
          bidCount: { type: 'integer' },
          viewers: { type: 'integer' },
        },
      },
    },
  },

  // CT-13
  ManagedProduct: {
    type: 'object',
    required: ['id', 'name', 'category', 'price', 'unit', 'stock', 'season', 'organic'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      category: CATEGORY,
      price: { type: 'number' },
      unit: UNIT,
      stock: { type: 'integer' },
      season: SEASON,
      organic: { type: 'boolean' },
      imageUrl: { type: 'string' },
    },
  },
  SaveProductRequest: {
    type: 'object',
    required: ['name', 'category', 'price', 'unit', 'stock', 'season', 'organic'],
    properties: {
      name: { type: 'string' },
      category: CATEGORY,
      price: { type: 'number' },
      unit: UNIT,
      stock: { type: 'integer' },
      season: SEASON,
      organic: { type: 'boolean' },
    },
  },
  ImageUploadResponse: {
    type: 'object',
    required: ['imageUrl'],
    properties: { imageUrl: { type: 'string' } },
  },

  // CT-14
  ProducerOrder: {
    type: 'object',
    required: ['id', 'status', 'createdAt', 'updatedAt', 'buyer', 'items', 'total', 'fulfilment'],
    properties: {
      id: { type: 'string' },
      status: ORDER_STATUS,
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      buyer: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
        },
      },
      items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
      total: { type: 'number' },
      fulfilment: { type: 'string', enum: ['pickup', 'delivery'] },
      address: { $ref: '#/components/schemas/Address' },
    },
  },
  UpdateOrderStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: { status: ORDER_STATUS },
  },

  // CT-15
  ProducerAuction: {
    type: 'object',
    required: [
      'id',
      'status',
      'product',
      'quantity',
      'unit',
      'basePrice',
      'increment',
      'durationMinutes',
      'startsAt',
      'endsAt',
      'currentPrice',
      'bidCount',
      'createdAt',
    ],
    properties: {
      id: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'scheduled', 'active', 'ended'] },
      product: {
        type: 'object',
        required: ['id', 'name', 'category', 'unit'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: CATEGORY,
          unit: UNIT,
        },
      },
      quantity: { type: 'integer' },
      unit: UNIT,
      basePrice: { type: 'number' },
      increment: { type: 'number' },
      durationMinutes: { type: 'integer' },
      startsAt: { type: 'string', format: 'date-time' },
      endsAt: { type: 'string', format: 'date-time' },
      currentPrice: { type: 'number' },
      bidCount: { type: 'integer' },
      leader: {
        type: 'object',
        nullable: true,
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  SaveAuctionRequest: {
    type: 'object',
    required: ['productId', 'quantity', 'basePrice', 'increment', 'durationMinutes', 'startsAt'],
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'integer' },
      basePrice: { type: 'number' },
      increment: { type: 'number' },
      durationMinutes: { type: 'integer' },
      startsAt: { type: 'string', format: 'date-time' },
    },
  },

  // CT-16
  ProducerReview: {
    type: 'object',
    required: ['id', 'author', 'rating', 'text', 'product', 'reported'],
    properties: {
      id: { type: 'string' },
      author: { type: 'string' },
      rating: { type: 'integer' },
      text: { type: 'string' },
      product: { type: 'string', nullable: true },
      reported: { type: 'boolean' },
    },
  },
  ReportReviewRequest: {
    type: 'object',
    required: ['reason'],
    properties: { reason: { type: 'string' } },
  },

  // CT-17
  ProducerPage: {
    type: 'object',
    required: ['id', 'name', 'bio', 'location'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      bio: { type: 'string' },
      location: { type: 'string' },
      lat: { type: 'number' },
      lng: { type: 'number' },
      photoUrl: { type: 'string' },
    },
  },
  SaveProducerPageRequest: {
    type: 'object',
    required: ['bio', 'location', 'lat', 'lng', 'photoUrl'],
    properties: {
      bio: { type: 'string' },
      location: { type: 'string' },
      lat: { type: 'number', nullable: true },
      lng: { type: 'number', nullable: true },
      photoUrl: { type: 'string' },
    },
  },

  // CT-18
  AdminSummary: {
    type: 'object',
    required: ['users', 'orders', 'activeAuctions', 'pendingProducers', 'byStatus', 'salesPerDay'],
    properties: {
      users: { type: 'integer' },
      orders: { type: 'integer' },
      activeAuctions: { type: 'integer' },
      pendingProducers: { type: 'integer' },
      byStatus: { type: 'object', additionalProperties: { type: 'integer' } },
      salesPerDay: {
        type: 'array',
        items: {
          type: 'object',
          required: ['date', 'total'],
          properties: { date: { type: 'string' }, total: { type: 'number' } },
        },
      },
    },
  },

  // CT-19
  PendingProducer: {
    type: 'object',
    required: ['id', 'name', 'email', 'categories', 'appliedAt', 'status'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      location: { type: 'string' },
      bio: { type: 'string' },
      categories: { type: 'array', items: { type: 'string' } },
      appliedAt: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['pending'] },
    },
  },
  RejectProducerRequest: {
    type: 'object',
    properties: { reason: { type: 'string' } },
  },

  // CT-20
  AdminReview: {
    type: 'object',
    required: ['id', 'author', 'rating', 'text', 'product', 'producer', 'createdAt', 'report', 'status'],
    properties: {
      id: { type: 'string' },
      author: { type: 'string' },
      rating: { type: 'integer' },
      text: { type: 'string' },
      product: { type: 'string', nullable: true },
      producer: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      report: {
        type: 'object',
        required: ['reason', 'reportedAt'],
        properties: {
          reason: { type: 'string' },
          note: { type: 'string' },
          reportedAt: { type: 'string', format: 'date-time' },
        },
      },
      status: { type: 'string', enum: ['reported', 'hidden'] },
    },
  },

  // CT-21
  AdminContentItem: {
    type: 'object',
    required: ['id', 'name', 'hidden'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      hidden: { type: 'boolean' },
    },
  },
  UpdateContentRequest: {
    type: 'object',
    required: ['hidden'],
    properties: { hidden: { type: 'boolean' } },
  },

  // CT-22
  AdminUser: {
    type: 'object',
    required: ['id', 'name', 'email', 'role', 'state'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['buyer', 'producer', 'admin'] },
      state: { type: 'string', enum: ['active', 'pending', 'suspended'] },
    },
  },
  AdminUsersResponse: {
    type: 'object',
    required: ['items', 'total'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminUser' } },
      total: { type: 'integer' },
    },
  },

  // CT-23
  AdminOrder: {
    type: 'object',
    required: ['id', 'buyerName', 'producerName', 'itemCount', 'total', 'status', 'createdAt'],
    properties: {
      id: { type: 'string' },
      buyerName: { type: 'string' },
      producerName: { type: 'string' },
      itemCount: { type: 'integer' },
      total: { type: 'number' },
      status: ORDER_STATUS,
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  AdminOrdersResponse: {
    type: 'object',
    required: ['items', 'total'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminOrder' } },
      total: { type: 'integer' },
    },
  },

  // CT-24
  AdminAuction: {
    type: 'object',
    required: ['id', 'status', 'product', 'producer', 'currentPrice', 'bidCount', 'startsAt', 'endsAt'],
    properties: {
      id: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'scheduled', 'active', 'ended'] },
      product: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
        },
      },
      producer: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      currentPrice: { type: 'number' },
      bidCount: { type: 'integer' },
      startsAt: { type: 'string', format: 'date-time', nullable: true },
      endsAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  AdminAuctionsResponse: {
    type: 'object',
    required: ['items', 'total'],
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/AdminAuction' } },
      total: { type: 'integer' },
    },
  },

  // CT-25
  ServiceStatus: {
    type: 'object',
    required: ['service', 'status', 'detail', 'latencyMs'],
    properties: {
      service: { type: 'string' },
      status: { type: 'string', enum: ['operational', 'degraded', 'down'] },
      detail: { type: 'string' },
      latencyMs: { type: 'integer', nullable: true },
    },
  },

  // CT-26
  ProducerDirectoryItem: {
    type: 'object',
    required: ['id', 'name', 'location', 'averageRating', 'productCount'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      location: { type: 'string' },
      averageRating: { type: 'number' },
      productCount: { type: 'integer' },
    },
  },

  // CT-27
  AuctionListItem: {
    type: 'object',
    required: ['id', 'product', 'currentPrice', 'endsAt', 'viewers', 'status'],
    properties: {
      id: { type: 'string' },
      product: {
        type: 'object',
        required: ['id', 'name', 'category'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
        },
      },
      currentPrice: { type: 'number' },
      endsAt: { type: 'string', format: 'date-time' },
      viewers: { type: 'integer' },
      status: { type: 'string', enum: ['active', 'scheduled', 'ended'] },
    },
  },
};
