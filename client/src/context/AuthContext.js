import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Creating an authentication context
const AuthContext = createContext();

// Authentication provider component
export const AuthProvider = ({ children }) => {
  // User Status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user information from local storage when the component mounts
  useEffect(() => {
    const initUser = async () => {
      const userInfo = localStorage.getItem("userInfo")
        ? JSON.parse(localStorage.getItem("userInfo"))
        : null;

      if (userInfo?.token) {
        try {
          console.log("Start Request /api/users/profile...");
          const { data } = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
          console.log("Receive user data:", data);

          const updatedUser = { ...userInfo, ...data };
          localStorage.setItem("userInfo", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (err) {
          console.error("Failed to refresh user information:", err);
          setUser(userInfo); // Even if it fails, set the original user
        }
      } else {
        setUser(userInfo); // If there is no token, just set
      }

      setLoading(false); // ✅ loading last settings
    };

    initUser();
  }, []);

  // Try to get a card for a new user
  const initializeUserCards = async (token) => {
    try {
      // Check if it is a new registered user
      const isNewRegistration =
        localStorage.getItem("isNewRegistration") === "true";

      // If it is a newly registered user, special processing is required to ensure that the card is only issued once
      if (isNewRegistration) {
        console.log("Detect a new registered user and perform a one-time card initialization");

        try {
          // Get the current status of all cards
          const inventoryResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const cardData = inventoryResponse.data;
          console.log("Current card inventory status:", cardData);

          // Directly call the clear API to issue a short-term card, the parameter isNewRegistration=true will clear the old card
          const shortCardResponse = await axios.post(
            "/api/cards/issue-daily?isNewRegistration=true",
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Short-term card initialization results:", shortCardResponse.data);

          // Get the current long-term card status
          const longCards =
            cardData.inventory?.filter(
              (card) =>
                card.type === "blank" &&
                card.taskDuration === "long" &&
                !card.used
            ) || [];

          // Handling long-term cards
          if (longCards.length !== 3) {
            // If there is a long-term card, delete it first
            if (longCards.length > 0) {
              for (const card of longCards) {
                try {
                  await axios.delete(`/api/cards/${card._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  console.log(`Existing long-term card has been deleted: ${card._id}`);
                } catch (error) {
                  console.error(
                    `Failed to delete long-term card:`,
                    error.response?.data?.message || error.message
                  );
                }
              }
            }

            // Create 3 new long-term cards
            for (let i = 0; i < 3; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "Initial long-term card",
                  description: "Long-term card automatically given to new users",
                  taskDuration: "long",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log("Successfully created 3 long-term cards");
          } else {
            console.log("The user already has 3 long-term cards, no need to create");
          }

          // Final inspection results
          const finalCheckResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const finalCardData = finalCheckResponse.data;
          const finalShortCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "short" && card.type === "blank"
            ) || [];
          const finalLongCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "long" && card.type === "blank"
            ) || [];

          console.log(
            `Final check: User has ${finalShortCards.length} Short-term cards and${finalLongCards.length} Long-term cards`
          );

          // Remove new registration mark to avoid repeated operations
          localStorage.removeItem("isNewRegistration");

          return; // Complete initialization and exit early
        } catch (error) {
          console.error(
            "Failed to initialize the card for new user:",
            error.response?.data?.message || error.message
          );
          // Remove the flag to avoid a loop that cannot be initialized
          localStorage.removeItem("isNewRegistration");
        }
      }

      // Normal process (fallback for non-new registered users or new user initialization failure)
      // Get the user's current card inventory
      const inventoryResponse = await axios.get(
        "/api/cards/inventory?noAutoIssue=true",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const cardData = inventoryResponse.data;
      console.log("Check user card inventory:", cardData);

      // If the user has no card or few cards, perform initialization
      if (!cardData.inventory || cardData.inventory.length < 6) {
        console.log("Insufficient user cards, initialize card inventory...");

        // Calculate the current number of short-term and long-term cards
        const shortCards =
          cardData.inventory?.filter(
            (card) => card.taskDuration === "short" && card.type === "blank"
          ) || [];
        const longCards =
          cardData.inventory?.filter(
            (card) => card.taskDuration === "long" && card.type === "blank"
          ) || [];

        let madeChanges = false;

        // Check the number of short-term cards to make sure there are exactly 3
        if (shortCards.length < 3) {
          const shortCardsNeeded = 3 - shortCards.length;
          console.log(`${shortCardsNeeded} short-term cards need to be created`);

          try {
            // Directly create as many short-term cards as needed
            for (let i = 0; i < shortCardsNeeded; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "Initial Short-Term Card",
                  description: "Short-term card automatically given to new users",
                  taskDuration: "short",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log(`Successfully created ${shortCardsNeeded} short-term cards`);
            madeChanges = true;
          } catch (err) {
            console.error(
              "Failed to create initial short-term card:",
              err.response?.data?.message || err.message
            );
          }
        } else if (shortCards.length > 3) {
          console.log(
            `The number of short-term cards (${shortCards.length}) exceeds 3, and the extra cards need to be deleted`
          );

          try {
            // 按创建时间排序
            const sortedShortCards = [...shortCards].sort((a, b) => {
              const dateA = new Date(a.issuedAt || a.createdAt);
              const dateB = new Date(b.issuedAt || b.createdAt);
              return dateB - dateA; // In reverse order, newest first
            });

            // Keep the latest 3 cards and delete the rest
            const cardsToKeep = sortedShortCards.slice(0, 3);
            const cardsToRemove = sortedShortCards.slice(3);

            console.log(
              `Keep ${cardsToKeep.length} of the latest short-term cards and delete ${cardsToRemove.length} of the redundant cards`
            );

            // Delete extra cards
            for (const card of cardsToRemove) {
              try {
                await axios.delete(`/api/cards/${card._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`Deleted redundant short-term cards: ${card._id}`);
              } catch (error) {
                console.error(
                  `Failed to delete extra cards:`,
                  error.response?.data?.message || error.message
                );
              }
            }
            madeChanges = true;
          } catch (error) {
            console.error("Error processing excess short-term cards:", error);
          }
        } else {
          console.log("The user has exactly 3 short-term cards");
        }

        // Check the long-term card count to make sure there are exactly 3
        if (longCards.length < 3) {
          const longCardsNeeded = 3 - longCards.length;
          console.log(`${longCardsNeeded} long-term cards need to be created`);

          try {
            // Create long-term cards one by one
            for (let i = 0; i < longCardsNeeded; i++) {
              await axios.post(
                "/api/cards/issue-blank",
                {
                  title: "Initial long-term card",
                  description: "Long-term card automatically given to new users",
                  taskDuration: "long",
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            }
            console.log(`Successfully created ${longCardsNeeded} long-term cards`);
            madeChanges = true;
          } catch (error) {
            console.error(
              "Failed to create initial long-term card:",
              error.response?.data?.message || error.message
            );
          }
        } else if (longCards.length > 3) {
          console.log(
            `The number of long-term cards (${longCards.length}) exceeds 3, delete the extra cards`
          );

          try {
            // Force sorting by creation time
            const sortedLongCards = [...longCards].sort((a, b) => {
              const dateA = new Date(a.issuedAt || a.createdAt);
              const dateB = new Date(b.issuedAt || b.createdAt);
              return dateB - dateA; // In reverse order, newest first
            });

            // Keep the latest 3 cards and delete the rest
            const cardsToKeep = sortedLongCards.slice(0, 3);
            const cardsToRemove = sortedLongCards.slice(3);

            console.log(
              `Keep ${cardsToKeep.length} latest cards and delete ${cardsToRemove.length} extra cards`
            );

            // Delete extra cards
            for (const card of cardsToRemove) {
              try {
                await axios.delete(`/api/cards/${card._id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`Deleted redundant long-term cards: ${card._id}`);
              } catch (error) {
                console.error(
                  `Failed to delete extra cards:`,
                  error.response?.data?.message || error.message
                );
              }
            }
            madeChanges = true;
          } catch (error) {
            console.error("Error processing extra cards:", error);
          }
        } else {
          console.log("The user has exactly 3 long-term cards");
        }

        // If a card is created or deleted, obtain the inventory again to confirm the quantity
        if (madeChanges) {
          // Get the user's card inventory again and confirm whether the quantity is correct
          const finalCheckResponse = await axios.get(
            "/api/cards/inventory?noAutoIssue=true",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const finalCardData = finalCheckResponse.data;
          const finalShortCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "short" && card.type === "blank"
            ) || [];
          const finalLongCards =
            finalCardData.inventory?.filter(
              (card) => card.taskDuration === "long" && card.type === "blank"
            ) || [];

          console.log(
            `Final check: User has ${finalShortCards.length} short-term cards and ${finalLongCards.length} long-term cards`
          );
        }
      } else {
        console.log("The user already has enough cards, no initialization is needed");
      }
    } catch (error) {
      console.error(
        "Failed to initialize the card:",
        error.response?.data?.message || error.message
      );
    }
  };

  // Login Function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post("/api/users/login", {
        email,
        password,
      });
      // Save user information to local storage
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);

      // Try to initialize the card
      await initializeUserCards(data.token);

      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to login, please check your credentials"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registering functions
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.post("/api/users/register", {
        username,
        email,
        password,
      });

      // Save user information to local storage
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);

      // New registered users must try to initialize the card
      console.log("新用户注册成功，初始化卡片...");

      // Add a marker to localStorage to indicate that this is a newly registered user and that card issuance needs to be controlled
      localStorage.setItem("isNewRegistration", "true");

      await initializeUserCards(data.token);

      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to register, please check your credentials"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
  };

  // Update User Information
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      // Set the authentication token in the request header
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put("/api/users/profile", userData, config);

      // Update user information in local storage
      const updatedUser = { ...user, ...data };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);

      return data;
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : "Failed to update profile, please try again"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
