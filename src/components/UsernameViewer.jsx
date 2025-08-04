import React, { useState, useEffect, useCallback } from "react";
import { useShogun } from "shogun-button-react";
import { gunAvatar } from "gun-avatar";
import {
  RefreshCw,
  Users,
  User,
  Copy,
  Check,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Interfaces for TypeScript-like structure
const UserData = {
  username: "",
  userPub: "",
  userEpub: "",
  createdAt: "",
  lastLogin: "",
  metadata: {},
};

const UsernameMapping = {
  username: "",
  userPub: "",
  isCurrentUser: false,
};

const PaginationState = {
  currentPage: 1,
  pageSize: 20,
  hasMore: true,
  isLoadingMore: false,
  totalLoaded: 0,
  lastProcessedKey: "",
};

const UsernameViewer = () => {
  const { sdk, userPub, username, isLoggedIn } = useShogun();

  // State management
  const [usernameMappings, setUsernameMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const [pagination, setPagination] = useState(PaginationState);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Clean Gun data by removing internal properties
  const cleanGunData = (data) => {
    if (!data || typeof data !== "object") return data;

    const cleanData = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        key !== "_" &&
        key !== "#" &&
        value !== undefined &&
        (typeof value !== "object" ||
          (typeof value === "object" &&
            !Object.prototype.hasOwnProperty.call(value, "#")))
      ) {
        cleanData[key] = value;
      }
    }
    return cleanData;
  };

  // Safe render function for displaying data
  const safeRender = (data) => {
    if (!data) return "N/A";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return "Invalid data";
      }
    }
    return String(data);
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(""), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setErrorMessage("Failed to copy to clipboard");
    }
  };

  // Load username mappings from Gun
  const loadUsernameMappings = useCallback(
    async (reset = true) => {
      if (!sdk || !isLoggedIn) {
        console.log("[UsernameViewer] SDK not available or user not logged in");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        console.log("[UsernameViewer] Loading username mappings...");

        const mappings = [];
        let processedCount = 0;
        const startTime = Date.now();

        // Get Gun instance from SDK
        const gun = sdk.db.gun;

        console.log("[UsernameViewer] Gun instance:", gun);
        console.log(
          "[UsernameViewer] Gun path:",
          gun.get("shogun").get("usernames")
        );

        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            console.log(
              `[UsernameViewer] Timeout after 10s, processed ${mappings.length} mappings`
            );
            setUsernameMappings(mappings);
            setPagination((prev) => ({
              ...prev,
              hasMore: false,
              isLoadingMore: false,
              totalLoaded: mappings.length,
            }));
            setIsLoading(false);
            resolve();
          }, 10000);

          // Try both approaches: map().on() and once()
          const listener = gun
            .get("shogun")
            .get("usernames")
            .map()
            .on((data, key) => {
              // Skip GunDB internal keys
              if (key === "_" || key.startsWith("#")) {
                return;
              }

              // Skip if no data
              if (!data) {
                return;
              }

              processedCount++;

              // Debug log for first few items
              if (processedCount <= 3) {
                console.log(`[UsernameViewer] Processing key: ${key}`, data);
              }

              // Handle the correct data structure: key = username, data = public key
              if (
                key &&
                data &&
                typeof key === "string" &&
                typeof data === "string" &&
                key.length > 0 &&
                data.length > 0
              ) {
                const mapping = {
                  username: key,
                  userPub: data, // data is the public key
                  userEpub: "", // We'll need to fetch this separately if needed
                  createdAt: "",
                  lastLogin: "",
                  metadata: {},
                  key: key,
                };

                // Check if this is the current user
                mapping.isCurrentUser = userPub && mapping.userPub === userPub;

                mappings.push(mapping);
              } else if (data && typeof data === "object") {
                // Fallback for object-based data structure
                const cleanData = cleanGunData(data);

                if (cleanData && Object.keys(cleanData).length > 0) {
                  const mapping = {
                    username:
                      cleanData.username ||
                      cleanData.alias ||
                      cleanData.name ||
                      key,
                    userPub:
                      cleanData.userPub ||
                      cleanData.pub ||
                      cleanData.publicKey ||
                      cleanData.public_key ||
                      key,
                    userEpub:
                      cleanData.userEpub ||
                      cleanData.epub ||
                      cleanData.encryptionKey ||
                      cleanData.encryption_key ||
                      "",
                    createdAt:
                      cleanData.createdAt ||
                      cleanData.created_at ||
                      cleanData.timestamp ||
                      "",
                    lastLogin:
                      cleanData.lastLogin ||
                      cleanData.last_login ||
                      cleanData.lastSeen ||
                      "",
                    metadata: cleanData.metadata || cleanData.meta || {},
                    key: key,
                  };

                  // Check if this is the current user
                  mapping.isCurrentUser =
                    userPub && mapping.userPub === userPub;

                  mappings.push(mapping);
                }
              }

              // Update state every 10 items for better UX
              if (processedCount % 10 === 0) {
                setUsernameMappings([...mappings]);
                setPagination((prev) => ({
                  ...prev,
                  totalLoaded: mappings.length,
                }));
              }
            });

          // Also try a direct once() approach as fallback
          gun
            .get("shogun")
            .get("usernames")
            .once((allData) => {
              console.log("[UsernameViewer] Direct once() data:", allData);
              if (allData && typeof allData === "object") {
                Object.entries(allData).forEach(([key, data]) => {
                  if (key === "_" || key.startsWith("#")) return;

                  // Handle the correct data structure: key = username, data = public key
                  if (
                    key &&
                    data &&
                    typeof key === "string" &&
                    typeof data === "string" &&
                    key.length > 0 &&
                    data.length > 0
                  ) {
                    const mapping = {
                      username: key,
                      userPub: data, // data is the public key
                      userEpub: "", // We'll need to fetch this separately if needed
                      createdAt: "",
                      lastLogin: "",
                      metadata: {},
                      key: key,
                    };

                    mapping.isCurrentUser =
                      userPub && mapping.userPub === userPub;

                    // Avoid duplicates
                    if (!mappings.find((m) => m.key === key)) {
                      mappings.push(mapping);
                    }
                  } else if (data && typeof data === "object") {
                    // Fallback for object-based data structure
                    const cleanData = cleanGunData(data);
                    if (cleanData && Object.keys(cleanData).length > 0) {
                      const mapping = {
                        username:
                          cleanData.username ||
                          cleanData.alias ||
                          cleanData.name ||
                          key,
                        userPub:
                          cleanData.userPub ||
                          cleanData.pub ||
                          cleanData.publicKey ||
                          cleanData.public_key ||
                          key,
                        userEpub:
                          cleanData.userEpub ||
                          cleanData.epub ||
                          cleanData.encryptionKey ||
                          cleanData.encryption_key ||
                          "",
                        createdAt:
                          cleanData.createdAt ||
                          cleanData.created_at ||
                          cleanData.timestamp ||
                          "",
                        lastLogin:
                          cleanData.lastLogin ||
                          cleanData.last_login ||
                          cleanData.lastSeen ||
                          "",
                        metadata: cleanData.metadata || cleanData.meta || {},
                        key: key,
                      };

                      mapping.isCurrentUser =
                        userPub && mapping.userPub === userPub;

                      // Avoid duplicates
                      if (!mappings.find((m) => m.key === key)) {
                        mappings.push(mapping);
                      }
                    }
                  }
                });

                setUsernameMappings([...mappings]);
                setPagination((prev) => ({
                  ...prev,
                  totalLoaded: mappings.length,
                }));
              }
            });

          // Cleanup function
          return () => {
            clearTimeout(timeoutId);
            if (listener && typeof listener.off === "function") {
              listener.off();
            }
          };
        });
      } catch (error) {
        console.error(
          "[UsernameViewer] Error loading username mappings:",
          error
        );
        setErrorMessage(`Failed to load usernames: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, isLoggedIn, userPub]
  );

  // Load more users (pagination)
  const loadMoreUsers = async () => {
    if (pagination.isLoadingMore || !pagination.hasMore) return;

    setPagination((prev) => ({ ...prev, isLoadingMore: true }));

    // Simulate loading more (in a real implementation, you'd use the lastProcessedKey)
    setTimeout(() => {
      setPagination((prev) => ({
        ...prev,
        isLoadingMore: false,
        currentPage: prev.currentPage + 1,
      }));
    }, 1000);
  };

  // Refresh function
  const handleRefresh = () => {
    loadUsernameMappings(true);
  };

  // Load more function
  const handleLoadMore = () => {
    loadMoreUsers();
  };

  // Filter usernames based on search term
  const filteredMappings = usernameMappings.filter(
    (mapping) =>
      mapping.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.userPub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load data on component mount
  useEffect(() => {
    if (isLoggedIn && sdk) {
      loadUsernameMappings(true);
    }
  }, [isLoggedIn, sdk, loadUsernameMappings]);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert-custom">
          <User className="w-6 h-6" />
          <span>Please log in to view usernames from the Shogun protocol.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Protocol Usernames
          </h2>
          <p className="text-secondary mt-1">
            View all registered usernames in the Shogun protocol
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-custom primary flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-custom secondary flex items-center gap-2"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Advanced
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="alert-custom error mb-4">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search usernames or addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-custom w-full pl-10"
          />
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="card-custom mb-6">
          <div className="card-body">
            <h3 className="card-title">Advanced Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Total Loaded</span>
                </label>
                <div className="text-lg font-mono">
                  {pagination.totalLoaded}
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Current Page</span>
                </label>
                <div className="text-lg font-mono">
                  {pagination.currentPage}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && usernameMappings.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading usernames from the protocol...</p>
          </div>
        </div>
      )}

      {/* Username List */}
      {!isLoading && (
        <div className="grid gap-4">
          {filteredMappings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No usernames found</p>
              <p className="text-secondary">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No usernames have been registered yet"}
              </p>
            </div>
          ) : (
            filteredMappings.map((mapping, index) => (
              <div
                key={`${mapping.key}-${index}`}
                className={`card-custom ${mapping.isCurrentUser ? "ring-2 ring-primary" : ""}`}
              >
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={gunAvatar({
                          pub: mapping.userPub || "default",
                          size: 60,
                          round: true,
                          svg: true,
                          dark: true,
                        })}
                        alt={`Avatar for ${mapping.username || "User"}`}
                        className="rounded-full w-[60px] h-[60px]"
                        onError={(e) => {
                          // Fallback to a default avatar if the gun-avatar fails
                          e.target.src = `data:image/svg+xml;base64,${btoa(`
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="60" height="60" fill="#374151"/>
                              <text x="30" y="35" font-family="Arial" font-size="24" fill="white" text-anchor="middle">👤</text>
                            </svg>
                          `)}`;
                        }}
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">
                          {mapping.username || "Unnamed User"}
                        </h3>
                        {mapping.isCurrentUser && (
                          <span className="badge-custom success text-xs">
                            You
                          </span>
                        )}
                      </div>

                      {/* Public Key */}
                      <div className="mb-2">
                        <label className="label">
                          <span className="label-text text-xs">Public Key</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-base-200 px-2 py-1 rounded flex-1 truncate">
                            {mapping.userPub && mapping.userPub !== mapping.username ? mapping.userPub : `Key: ${mapping.key}`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(mapping.userPub || mapping.key)}
                            className="btn-custom ghost btn-sm"
                            title="Copy public key"
                          >
                            {copiedAddress === (mapping.userPub || mapping.key) ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Encryption Public Key */}
                      {mapping.userEpub && mapping.userEpub.trim() && (
                        <div className="mb-2">
                          <label className="label">
                            <span className="label-text text-xs">
                              Encryption Key
                            </span>
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-base-200 px-2 py-1 rounded flex-1 truncate">
                              {mapping.userEpub.length > 20
                                ? `${mapping.userEpub.substring(0, 20)}...`
                                : mapping.userEpub}
                            </code>
                            <button
                              onClick={() => copyToClipboard(mapping.userEpub)}
                              className="btn-custom ghost btn-sm"
                              title="Copy encryption key"
                            >
                              {copiedAddress === mapping.userEpub ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {mapping.metadata &&
                        Object.keys(mapping.metadata).length > 0 && (
                          <div className="mt-2">
                            <details className="collapse collapse-arrow bg-base-200">
                              <summary className="collapse-title text-sm font-medium">
                                Metadata
                              </summary>
                              <div className="collapse-content">
                                <pre className="text-xs overflow-auto">
                                  {safeRender(mapping.metadata)}
                                </pre>
                              </div>
                            </details>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasMore && filteredMappings.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={pagination.isLoadingMore}
            className="btn-custom primary"
          >
            {pagination.isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 text-center text-sm text-secondary">
        <p>
          Showing {filteredMappings.length} of {usernameMappings.length}{" "}
          usernames
          {searchTerm && ` (filtered by "${searchTerm}")`}
        </p>
      </div>
    </div>
  );
};

export default UsernameViewer;
